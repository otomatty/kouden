/**
 * staging / production の D1 にマイグレーションを適用する。
 *
 *   bun run db:migrate -- --mode staging
 *
 * `--allow-missing` を付けると、DB がまだ無い場合（初回デプロイ前）に何もせず正常終了する。
 *
 * `cf d1 migrations apply` は DB の ID しか受け付けないため、deploy.settings.ts の名前から ID を引く。
 * 認証は `cf auth login` または環境変数 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { parseArgs } from "node:util";
import { MODES, resolveMode } from "../deploy.settings.ts";

const { values } = parseArgs({
	options: {
		mode: { type: "string" },
		"dry-run": { type: "boolean", default: false },
		"allow-missing": { type: "boolean", default: false },
	},
});
const mode = resolveMode(values.mode);
if (mode === "development") {
	console.error("ローカルには `bun run db:migrate:local` を使ってください");
	process.exit(1);
}

const appDir = path.resolve(import.meta.dirname, "..");
const settings = MODES[mode];

function cf(args: string[]): string {
	const res = spawnSync("cf", args, {
		cwd: appDir,
		encoding: "utf8",
		env: { ...process.env, CF_QUIET: "1" },
	});
	if (res.status !== 0) {
		console.error(res.stderr || res.stdout);
		process.exit(res.status ?? 1);
	}
	return res.stdout;
}

let databaseId = settings.d1.id;
if (!databaseId) {
	const list = JSON.parse(cf(["d1", "list", "--name", settings.d1.name])) as Array<{
		uuid: string;
		name: string;
	}>;
	databaseId = list.find((db) => db.name === settings.d1.name)?.uuid;
	if (!databaseId && values["allow-missing"]) {
		console.warn(`D1 "${settings.d1.name}" はまだありません。マイグレーションをスキップします`);
		process.exit(0);
	}
	if (!databaseId) {
		console.error(
			`D1 "${settings.d1.name}" が見つかりません。先に \`bun run deploy -- --mode ${mode}\` で作成してください`,
		);
		process.exit(1);
	}
}

console.info(`mode=${mode} database=${settings.d1.name} (${databaseId})`);
const applyArgs = ["d1", "migrations", "apply", databaseId, "--dir", "migrations"];
if (values["dry-run"]) applyArgs.push("--dry-run");
console.info(cf(applyArgs));
