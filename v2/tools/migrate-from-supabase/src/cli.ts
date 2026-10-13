import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { createImportClient } from "./client.ts";
import { loadPlan, prepare } from "./prepare.ts";
import { runMigration } from "./run.ts";

const HELP = `使い方:
  bun run migrate prepare --source <source-snapshot.json> --out <private-dir> [--files <file-map.json>]
  bun run migrate import --plan <private-dir> --url <https-origin> --report <new-report-dir>
  bun run migrate verify --plan <private-dir> --url <https-origin> --report <new-report-dir>

prepare は通信しません。import は台帳を入れ替えます。書き込み停止中に実行してください。
verify は読み取りのみです。認証は CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET、
localhost だけ IMPORT_DEV_TOKEN を使用します。ファイルには個人情報が含まれます。
`;

async function main(): Promise<void> {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
		options: {
			source: { type: "string" },
			out: { type: "string" },
			files: { type: "string" },
			plan: { type: "string" },
			url: { type: "string" },
			report: { type: "string" },
			help: { type: "boolean" },
		},
	});
	if (values.help || !positionals.length) {
		process.stdout.write(HELP);
		return;
	}
	const [command] = positionals;
	if (positionals.length !== 1) throw new Error("invalid_command");
	if (command === "prepare") {
		if (!values.source || !values.out || values.plan || values.url || values.report)
			throw new Error("prepare_arguments");
		const plan = await prepare(
			resolve(values.source),
			resolve(values.out),
			values.files ? resolve(values.files) : undefined,
		);
		process.stdout.write(
			`準備完了: ${plan.users.length} 人、${plan.koudens.length} 冊、警告 ${plan.warnings.length} 件\n`,
		);
		return;
	}
	if (command !== "import" && command !== "verify") throw new Error("invalid_command");
	if (!values.plan || !values.url || !values.report || values.source || values.out || values.files)
		throw new Error("run_arguments");
	const planDir = resolve(values.plan);
	const client = createImportClient(
		values.url,
		process.env.IMPORT_DEV_TOKEN
			? { devToken: process.env.IMPORT_DEV_TOKEN }
			: {
					clientId: process.env.CF_ACCESS_CLIENT_ID ?? "",
					clientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? "",
				},
	);
	const report = await runMigration({
		mode: command,
		plan: await loadPlan(planDir),
		planDir,
		reportDir: resolve(values.report),
		client,
	});
	process.stdout.write(
		`${report.status}: ${report.usersVerified} 人、${report.booksVerified} 冊、画像 ${report.filesVerified} 件を照合\n`,
	);
	if (report.status !== "passed") process.exitCode = 1;
}

// 入力の値や秘密情報が例外メッセージに含まれる可能性があるため、生の例外は表示しない。
await main().catch(() => {
	process.stderr.write(
		"移行CLIに失敗しました。引数・入力形式・保存先・認証設定を確認してください。\n",
	);
	process.exitCode = 1;
});
