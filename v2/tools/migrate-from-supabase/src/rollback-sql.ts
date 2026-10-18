import { spawn } from "node:child_process";
import { z } from "zod";
import { canonical, type Row } from "./rollback-export.ts";
import { ROLLBACK_TABLES, type RollbackPlan, type Table } from "./rollback-plan.ts";

const identifier = (s: string) => {
	if (!/^[a-z][a-z0-9_]*$/.test(s)) throw new Error("rollback_invalid_column");
	return `"${s}"`;
};
/** 生成列と、旧DBのトリガーが保つ列（has_offering は offering_entries のトリガーが更新する）。 */
const generated = (table: Table, column: string) =>
	(table === "return_entry_records" &&
		["additional_return_amount", "profit_loss"].includes(column)) ||
	(table === "kouden_entries" && column === "has_offering");
const literal = (value: unknown) =>
	`convert_from(decode('${Buffer.from(JSON.stringify(value)).toString("hex")}', 'hex'), 'UTF8')::jsonb`;

/** PostgreSQL の型で日時・数値を正規化し、件数・ID・各列を NULL を含めて照合する。 */
function matches(table: Table, variable: string, ignoreAudit: boolean): string {
	return `((SELECT count(*) FROM public.${table}) = jsonb_array_length(${variable}->'${table}') AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(${variable}->'${table}') e
    LEFT JOIN public.${table} actual ON actual.id = (e->>'id')::uuid
    WHERE actual.id IS NULL OR EXISTS (
      SELECT 1 FROM jsonb_each(to_jsonb(jsonb_populate_record(NULL::public.${table}, e))) f
      WHERE e ? f.key ${ignoreAudit ? "AND f.key NOT IN ('updated_at','last_modified_at','version')" : ""}
      AND (to_jsonb(actual)->f.key) IS DISTINCT FROM f.value)))`;
}

/** 1 回のトランザクション。前提不一致、FK/トリガーの失敗、照合不一致は全件ロールバック。 */
export function rollbackSql(plan: RollbackPlan, mode: "apply" | "verify"): string {
	if (plan.blockers.length) throw new Error("rollback_blocked");
	const statements: string[] = [];
	if (mode === "apply") {
		// 有効な関係名の一意制約は遅延できない。改名・非表示・削除する行を先に無効にして名前を空け、
		// 以降は最終状態の有効な名前だけが並ぶようにする（最終状態の重複は計画時に停止済み）。
		const released = new Set(
			plan.before.relationships
				.filter((old) => {
					if (old.is_enabled !== true) return false;
					const row = plan.after.relationships.find((r) => r.id === old.id);
					return !row || row.name !== old.name || row.is_enabled !== true;
				})
				.map((r) => String(r.id)),
		);
		if (released.size)
			statements.push(
				`UPDATE public.relationships SET is_enabled = false WHERE id IN (SELECT (jsonb_array_elements_text(${literal([...released])}))::uuid);`,
			);
		for (const table of ROLLBACK_TABLES) {
			plan.after[table].forEach((row, index) => {
				const old = plan.before[table].find((r) => r.id === row.id);
				const columns = Object.keys(row).filter(
					(k) =>
						!generated(table, k) &&
						(!old ||
							canonical(old[k]) !== canonical(row[k]) ||
							(table === "relationships" && k === "is_enabled" && released.has(String(row.id)))),
				);
				if (!columns.length) return;
				const record = `jsonb_populate_record(NULL::public.${table}, desired->'${table}'->${index})`;
				if (table === "kouden_entries") {
					const actorField = old ? "last_modified_by" : "created_by";
					if (!z.uuid().safeParse(row[actorField]).success)
						throw new Error("rollback_entry_actor_required");
					// auth.uid() を使う旧監査トリガーへ、この行の実行者だけを渡す。
					statements.push(
						"saved_actor := current_setting('request.jwt.claim.sub', true);",
						`PERFORM set_config('request.jwt.claim.sub', desired->'${table}'->${index}->>'${actorField}', true);`,
					);
				}
				if (!old)
					statements.push(
						`INSERT INTO public.${table} (${columns.map(identifier).join(", ")}) SELECT ${columns.map(identifier).join(", ")} FROM ${record};`,
					);
				else
					statements.push(
						`UPDATE public.${table} SET (${columns.map(identifier).join(", ")}) = (SELECT ${columns.map(identifier).join(", ")} FROM ${record}) WHERE id = (desired->'${table}'->${index}->>'id')::uuid;`,
					);
				if (table === "kouden_entries")
					statements.push(
						"PERFORM set_config('request.jwt.claim.sub', coalesce(saved_actor, ''), true);",
					);
			});
		}
		// 新しい参照先の作成と既存の参照の更新を終えてから、子→親の順で削除する。
		for (const table of ROLLBACK_TABLES.toReversed()) {
			for (const row of plan.before[table])
				if (!plan.after[table].some((r) => r.id === row.id))
					statements.push(
						`DELETE FROM public.${table} WHERE id = (${literal(row.id)}#>>'{}')::uuid;`,
					);
		}
	}
	const checks = ROLLBACK_TABLES.map(
		(t) =>
			`IF NOT ${matches(t, "desired", true)} THEN RAISE EXCEPTION 'rollback_verify_failed:${t}'; END IF;`,
	).join("\n");
	return `-- Contains private records. Do not commit or paste into issue/PR logs.
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
${mode === "verify" ? "SET TRANSACTION READ ONLY;" : ""}
LOCK TABLE ${ROLLBACK_TABLES.map((t) => `public.${t}`).join(", ")} IN ${mode === "verify" ? "ACCESS SHARE" : "EXCLUSIVE"} MODE;
DO $rollback$
DECLARE original jsonb := ${literal(plan.before)};
        desired jsonb := ${literal(plan.after)};
        saved_actor text;
BEGIN
${
	mode === "apply"
		? `IF ${ROLLBACK_TABLES.map((t) => matches(t, "desired", true)).join(" AND ")} THEN RETURN; END IF;
${ROLLBACK_TABLES.map((t) => `IF NOT ${matches(t, "original", false)} THEN RAISE EXCEPTION 'rollback_precondition_failed:${t}'; END IF;`).join("\n")}
${statements.join("\n")}`
		: ""
}
${checks}
END;
$rollback$;
COMMIT;
`;
}

/** 接続先はコマンドラインに秘密を載せず PG* 環境変数で指定する。 */
export function checkedPgEnv(project: string, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
	if (!/^[a-z0-9]{20}$/.test(project)) throw new Error("rollback_invalid_project");
	const direct = env.PGHOST === `db.${project}.supabase.co` && env.PGUSER === "postgres";
	const pooler =
		/^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(env.PGHOST ?? "") &&
		env.PGUSER === `postgres.${project}`;
	if ((!direct && !pooler) || env.PGDATABASE !== "postgres" || (env.PGPORT ?? "5432") !== "5432")
		throw new Error("rollback_database_target_mismatch");
	if (
		!env.PGPASSWORD ||
		(env.PGSSLMODE && !["require", "verify-ca", "verify-full"].includes(env.PGSSLMODE))
	)
		throw new Error("rollback_database_credentials");
	const safeEnv = { ...env };
	delete safeEnv.PGHOSTADDR;
	delete safeEnv.PGSERVICE;
	delete safeEnv.PGSERVICEFILE;
	delete safeEnv.PGOPTIONS;
	return {
		...safeEnv,
		PGSSLMODE: env.PGSSLMODE ?? "verify-full",
		PGAPPNAME: "kouden-rollback",
		PGCONNECT_TIMEOUT: "15",
	};
}

export async function executeRollbackSql(
	sql: string,
	project: string,
	env = process.env,
): Promise<void> {
	const checked = checkedPgEnv(project, env);
	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			"psql",
			[
				"-X",
				"-q",
				"--set",
				"ON_ERROR_STOP=1",
				"--file",
				"-",
				"--host",
				checked.PGHOST!,
				"--port",
				"5432",
				"--username",
				checked.PGUSER!,
				"--dbname",
				"postgres",
			],
			{ env: checked, windowsHide: true, stdio: ["pipe", "ignore", "pipe"] },
		);
		let diagnostic = "";
		child.stderr.on("data", (chunk: Buffer) => {
			diagnostic = (diagnostic + chunk.toString()).slice(-8192);
		});
		child.stdin.on("error", () => {
			/* 早期終了時の EPIPE。close で終了コードを確認する。 */
		});
		child.on("error", () => reject(new Error("rollback_psql_unavailable")));
		child.on("close", (code) => {
			if (code === 0) resolve();
			else
				reject(
					new Error(
						diagnostic.includes("rollback_precondition_failed:")
							? "rollback_precondition_failed"
							: diagnostic.includes("rollback_verify_failed:")
								? "rollback_verify_failed"
								: "rollback_database_failed",
					),
				);
		});
		child.stdin.end(sql);
	});
}

export function rollbackReport(plan: RollbackPlan): Row {
	return {
		version: 1,
		status: plan.blockers.length ? "blocked" : "ready",
		sourceProject: plan.sourceProject,
		sourceSha256: plan.sourceSha256,
		exportSha256: plan.exportSha256,
		changes: plan.changes,
		blockers: plan.blockers,
		books: plan.books,
		notices: plan.notices,
		verification: {
			ignoredAuditColumns: ["updated_at", "last_modified_at", "version"],
			tables: ROLLBACK_TABLES.map((table) => ({ table, expectedRows: plan.after[table].length })),
			koudens: plan.after.koudens.map((book) => {
				const entries = plan.after.kouden_entries.filter((e) => e.kouden_id === book.id);
				const entryIds = new Set(entries.map((e) => e.id));
				const returns = plan.after.return_entry_records.filter((r) =>
					entryIds.has(r.kouden_entry_id),
				);
				return {
					id: book.id,
					ownerId: book.owner_id,
					members: plan.after.kouden_members.filter((m) => m.kouden_id === book.id).length,
					kodenCount: entries.length,
					kodenTotal: entries.reduce((sum, e) => sum + Number(e.amount), 0),
					offerings: plan.after.offerings.filter((o) => o.kouden_id === book.id).length,
					telegrams: plan.after.telegrams.filter((t) => t.kouden_id === book.id).length,
					returnItems: plan.after.return_items.filter((r) => r.kouden_id === book.id).length,
					returns: Object.fromEntries(
						["PENDING", "PARTIAL_RETURNED", "COMPLETED", "NOT_REQUIRED"].map((s) => [
							s,
							returns.filter((r) => r.return_status === s).length,
						]),
					),
				};
			}),
		},
	};
}
