import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createImportClient } from "./client.ts";
import { digest, json, privateJson } from "./prepare.ts";
import { captureRollback } from "./rollback-export.ts";
import { planRollback } from "./rollback-plan.ts";
import { executeRollbackSql, rollbackReport, rollbackSql } from "./rollback-sql.ts";

async function main() {
	const { values: v, positionals } = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
		options: {
			url: { type: "string" },
			source: { type: "string" },
			snapshot: { type: "string" },
			out: { type: "string" },
			"writes-stopped": { type: "boolean" },
			"project-ref": { type: "string" },
			"approve-sha256": { type: "string" },
			help: { type: "boolean" },
		},
	});
	if (v.help || !positionals.length) {
		process.stdout.write(`使い方:
  bun run rollback export --url <origin> --writes-stopped --out <new-private-dir>
  bun run rollback plan --source <original-source.json> --snapshot <v2-export.json> --out <new-private-dir>
  bun run rollback apply --source <original-source.json> --snapshot <v2-export.json> --project-ref <ref> --approve-sha256 <apply.sql SHA256> --writes-stopped --out <new-report-dir>
  bun run rollback verify --source <original-source.json> --snapshot <v2-export.json> --project-ref <ref> --writes-stopped --out <new-report-dir>

apply/verify は psql と PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD を使用します。
export/apply/verify の前に両アプリの書き込み・Webhook・ジョブを停止してください。
export は CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET（localhost は IMPORT_DEV_TOKEN）を使用します。
全出力は個人情報を含む非公開ディレクトリに保管してください。
`);
		return;
	}
	const command = positionals[0];
	if (
		positionals.length !== 1 ||
		!["export", "plan", "apply", "verify"].includes(command!) ||
		!v.out
	)
		throw new Error("rollback_arguments");
	if (command === "export") {
		if (
			!v.url ||
			!v["writes-stopped"] ||
			v.source ||
			v.snapshot ||
			v["project-ref"] ||
			v["approve-sha256"]
		)
			throw new Error("rollback_arguments");
		const client = createImportClient(
			v.url,
			process.env.IMPORT_DEV_TOKEN
				? { devToken: process.env.IMPORT_DEV_TOKEN }
				: {
						clientId: process.env.CF_ACCESS_CLIENT_ID ?? "",
						clientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? "",
					},
		);
		const data = await captureRollback(client, true);
		await mkdir(resolve(v.out), { mode: 0o700 });
		await privateJson(resolve(v.out, "v2-export.json"), data);
		process.stdout.write(`取得完了: ${data.manifest.users.length} 人、${data.ledgers.length} 冊\n`);
		return;
	}
	if (
		!v.source ||
		!v.snapshot ||
		v.url ||
		(command === "plan" && (v["approve-sha256"] || v["project-ref"]))
	)
		throw new Error("rollback_arguments");
	const plan = planRollback(await json(resolve(v.source)), await json(resolve(v.snapshot)));
	if (command !== "plan" && (!v["writes-stopped"] || v["project-ref"] !== plan.sourceProject))
		throw new Error("rollback_confirmation_required");
	await mkdir(resolve(v.out), { mode: 0o700 });
	const report = rollbackReport(plan);
	await privateJson(resolve(v.out, "report.json"), report);
	if (plan.blockers.length) {
		process.stdout.write(
			`停止: ${plan.blockers.length} 件の未対応変更。report.json を確認してください。\n`,
		);
		process.exitCode = 1;
		return;
	}
	const sql = rollbackSql(plan, command === "verify" ? "verify" : "apply");
	const sha256 = digest(sql);
	if (command === "plan") {
		await writeFile(resolve(v.out, "apply.sql"), sql, { mode: 0o600, flag: "wx" });
		await writeFile(resolve(v.out, "verify.sql"), rollbackSql(plan, "verify"), {
			mode: 0o600,
			flag: "wx",
		});
		await privateJson(resolve(v.out, "report.json"), { ...report, sqlSha256: sha256 });
		process.stdout.write(`計画作成完了。apply.sql の SHA256: ${sha256}\n`);
		return;
	}
	if (command === "apply" && v["approve-sha256"] !== sha256)
		throw new Error("rollback_approval_mismatch");
	try {
		await executeRollbackSql(sql, plan.sourceProject);
		await privateJson(resolve(v.out, "report.json"), {
			...report,
			status: "passed",
			mode: command,
			sqlSha256: sha256,
			completedAt: new Date().toISOString(),
		});
		process.stdout.write(`${command}: 全テーブルの照合が成功しました。\n`);
	} catch (error) {
		await privateJson(resolve(v.out, "report.json"), {
			...report,
			status: "failed",
			mode: command,
		});
		throw error;
	}
}

// DB エラー、Zod の入力値、psql の SQL 引用を標準出力へ漏らさない。
await main().catch((error: unknown) => {
	const code =
		error instanceof Error && /^rollback_[a-z_]+$/.test(error.message)
			? error.message
			: "rollback_invalid_input_or_io";
	process.stderr.write(`切り戻し処理を停止しました: ${code}\n`);
	process.exitCode = 1;
});
