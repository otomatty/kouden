import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { expectedImportState, importDifferences } from "@kouden/domain";
import type { ImportClient } from "./client.ts";
import { digest, privateJson, validatePlan } from "./prepare.ts";
import { planSchema, type MigrationPlan } from "./schemas.ts";
import { userPayloads } from "./transform.ts";

export interface MigrationReport {
	version: 1;
	mode: "import" | "verify";
	status: "running" | "passed" | "failed";
	origin: string;
	planSha256: string;
	startedAt: string;
	finishedAt?: string;
	usersVerified: number;
	booksVerified: number;
	filesVerified: number;
	fileBytesVerified: number;
	warnings: Record<string, number>;
	measurements: { scope: string; metric: string; expected: number; actual: number | null }[];
	checks: { scope: string; differences: string[] }[];
	error?: string;
}

export function reportMarkdown(report: MigrationReport): string {
	return [
		"# 移行照合レポート",
		"",
		`結果: ${report.status}`,
		`操作: ${report.mode}`,
		`接続先: ${report.origin}`,
		`計画の SHA-256: ${report.planSha256}`,
		"",
		`照合済み: ユーザー ${report.usersVerified} 人、台帳 ${report.booksVerified} 冊、画像 ${report.filesVerified} 件 / ${report.fileBytesVerified} bytes。`,
		"",
		"D1 のユーザー・台帳・メンバー・購入、DO の件数・香典合計・返礼状況、R2 のキー・サイズ・SHA-256 を照合する。DO の全テキスト項目の一致や画面表示を保証する検査ではない。",
		"",
		"## 件数・金額の照合",
		"",
		"| 対象 | 項目 | 移行予定 | 投入後 |",
		"| --- | --- | ---: | ---: |",
		...report.measurements.map(
			(m) => `| ${m.scope} | ${m.metric} | ${m.expected} | ${m.actual ?? "取得不可"} |`,
		),
		"",
		"## 変換時の警告",
		"",
		...Object.entries(report.warnings).map(([code, count]) => `- ${code}: ${count}`),
		"",
		"## 不一致・失敗",
		"",
		...report.checks
			.filter((c) => c.differences.length)
			.map((c) => `- ${c.scope}: ${c.differences.join(", ")}`),
		...(report.error ? [`- ${report.error}`] : []),
		"",
	].join("\n");
}

const listSchema = z.object({
	objects: z.array(z.object({ key: z.string(), size: z.number().int().nonnegative() })),
	cursor: z.string().nullable(),
});
const usersCheckSchema = z.object({
	checked: z.number().int().nonnegative(),
	differences: z.array(z.string()),
});

/** 不一致・通信失敗はレポートを残して停止。再実行時は全件を再送し、読み戻して確認する。 */
export async function runMigration(options: {
	mode: "import" | "verify";
	plan: MigrationPlan;
	planDir: string;
	reportDir: string;
	client: ImportClient;
}): Promise<MigrationReport> {
	const { mode, planDir, reportDir, client } = options;
	const plan = planSchema.parse(options.plan);
	validatePlan(plan);
	const report: MigrationReport = {
		version: 1,
		mode,
		status: "running",
		origin: client.origin,
		planSha256: digest(JSON.stringify(plan)),
		startedAt: new Date().toISOString(),
		usersVerified: 0,
		booksVerified: 0,
		filesVerified: 0,
		fileBytesVerified: 0,
		warnings: {},
		measurements: [],
		checks: [],
	};
	for (const w of plan.warnings) report.warnings[w.code] = (report.warnings[w.code] ?? 0) + 1;
	await mkdir(reportDir, { recursive: true, mode: 0o700 });
	const save = async () => {
		await privateJson(join(reportDir, "report.json"), report);
		await writeFile(join(reportDir, "report.md"), reportMarkdown(report), { mode: 0o600 });
	};
	const check = (scope: string, expected: unknown, actual: unknown) => {
		const differences = importDifferences(expected, actual);
		report.checks.push({ scope, differences });
		if (differences.length) throw new Error("verification_mismatch");
	};
	// 数値の集計だけを保存する。D1 の氏名・連絡先・Google sub はレポートに含めない。
	const measure = (scope: string, expected: unknown, actual: unknown, metric = "") => {
		if (typeof expected === "number") {
			report.measurements.push({
				scope,
				metric,
				expected,
				actual: typeof actual === "number" && Number.isFinite(actual) ? actual : null,
			});
		} else if (expected && typeof expected === "object") {
			const row = actual && typeof actual === "object" ? (actual as Record<string, unknown>) : {};
			for (const [key, value] of Object.entries(expected))
				measure(scope, value, row[key], metric ? `${metric}.${key}` : key);
		}
	};
	const requestJson = (path: string, body: unknown, method = "POST") =>
		client.request(path, method, JSON.stringify(body), { "Content-Type": "application/json" });
	await save();
	try {
		// 画像の欠落・差し替えはユーザーを書き込む前に検出する。verify はローカル本体を必要としない。
		if (mode === "import")
			for (const book of plan.koudens)
				for (const file of book.files) {
					const bytes = await readFile(join(planDir, "files", `${file.sha256}.bin`));
					if (bytes.length !== file.size || digest(bytes) !== file.sha256)
						throw new Error("local_file_checksum");
				}
		for (const batch of userPayloads(plan.users)) {
			if (mode === "import")
				check(
					"users.import",
					{ imported: batch.users.length },
					await requestJson("/internal/import/users", batch),
				);
			const state = usersCheckSchema.parse(
				await requestJson("/internal/import/users/verify", batch),
			);
			const scope = `users.batch${Math.floor(report.usersVerified / 200) + 1}`;
			measure(scope, { checked: batch.users.length }, state);
			check(`${scope}.count`, { checked: batch.users.length }, state);
			report.checks.push({ scope, differences: state.differences });
			if (state.differences.length) throw new Error("verification_mismatch");
			report.usersVerified += batch.users.length;
			await save();
		}
		for (const book of plan.koudens) {
			const id = book.payload.koudenId;
			const path = `/internal/import/koudens/${encodeURIComponent(id)}`;
			if (mode === "import") {
				for (const file of book.files) {
					const bytes = await readFile(join(planDir, "files", `${file.sha256}.bin`));
					if (bytes.length !== file.size || digest(bytes) !== file.sha256)
						throw new Error("local_file_checksum");
					check(
						`${id}.upload`,
						file,
						await client.request(
							`/internal/import/files?key=${encodeURIComponent(file.key)}`,
							"PUT",
							bytes,
							{ "Content-Type": "application/octet-stream", "X-Content-SHA256": file.sha256 },
						),
					);
				}
				await requestJson(path, book.payload, "PUT");
			}
			// PUT の応答だけで成功とせず、D1 と DO を読み戻す。
			const expected = expectedImportState(book.payload);
			const actual = await client.request(path);
			measure(
				id,
				{
					ledger: expected.ledger,
					d1: { members: expected.d1.members, paidPurchases: expected.d1.paidPurchases },
				},
				actual,
			);
			check(`${id}.data`, expected, actual);
			const objects: { key: string; size: number }[] = [];
			let cursor: string | null = null;
			const seen = new Set<string>();
			do {
				const page = listSchema.parse(
					await client.request(
						`${path}/files${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
					),
				);
				objects.push(...page.objects);
				cursor = page.cursor;
				if (cursor && seen.has(cursor)) throw new Error("repeated_file_cursor");
				if (cursor) seen.add(cursor);
			} while (cursor);
			measure(
				`${id}.files`,
				{
					count: book.files.length,
					bytes: book.files.reduce((sum, f) => sum + f.size, 0),
				},
				{ count: objects.length, bytes: objects.reduce((sum, f) => sum + f.size, 0) },
			);
			check(
				`${id}.files`,
				book.files
					.map((f) => ({ key: f.key, size: f.size }))
					.toSorted((a, b) => a.key.localeCompare(b.key)),
				objects.toSorted((a, b) => a.key.localeCompare(b.key)),
			);
			for (const file of book.files) {
				check(
					`${id}.file_digest`,
					file,
					await client.request(`/internal/import/files?key=${encodeURIComponent(file.key)}`),
				);
				report.filesVerified++;
				report.fileBytesVerified += file.size;
			}
			report.booksVerified++;
			await save();
		}
		const expectedTotals = {
			users: plan.users.length,
			legacyUsers: plan.users.length,
			koudens: plan.koudens.length,
		};
		const actualTotals = await client.request("/internal/import/summary");
		measure("totals", expectedTotals, actualTotals);
		check("totals", expectedTotals, actualTotals);
		report.status = "passed";
	} catch (error) {
		report.status = "failed";
		// ネットワークや Zod の生のメッセージを CLI に出さない。
		const code = error instanceof Error ? error.message : "";
		report.error = /^[a-z_]+(?:_\d{3})?$/.test(code) ? code : "migration_failed";
	}
	report.finishedAt = new Date().toISOString();
	await save();
	return report;
}
