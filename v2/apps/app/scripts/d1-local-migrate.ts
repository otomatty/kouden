/**
 * ローカル開発用 D1（`cf dev` が使う .cloudflare/state）にマイグレーションを適用する。
 *
 * `cf d1 migrations apply --local` はベータ版で動作が不安定なため、Miniflare を直接使う。
 * 適用履歴は wrangler / cf と同じ形式の `d1_migrations` テーブルに記録する。
 * 環境変数 KOUDEN_LOCAL_STATE で保存先を変えられる（E2E 用。vite.config.ts と合わせる）。
 */
import path from "node:path";
import { readD1Migrations } from "@cloudflare/vitest-plugin";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { LOCAL_D1_ID } from "../deploy.settings.ts";

const appDir = path.resolve(import.meta.dirname, "..");
const stateDir = process.env.KOUDEN_LOCAL_STATE ?? path.join(appDir, ".cloudflare/state");

const mf = new Miniflare({
	...convertV4MiniflareOptions({
		modules: true,
		script: "export default {}",
		d1Databases: { DB: LOCAL_D1_ID },
	}),
	// `cf dev`（Cloudflare Vite plugin）と同じ保存先
	resourcePersistencePath: path.join(stateDir, "v3"),
	resourceTmpPath: path.join(appDir, ".cloudflare/tmp"),
	telemetry: { enabled: false },
});

try {
	const db = await mf.getD1Database("DB");
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS d1_migrations (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT UNIQUE,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
       )`,
		)
		.run();

	const applied = new Set(
		(await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>()).results.map(
			(r: { name: string }) => r.name,
		),
	);
	const migrations = await readD1Migrations(path.join(appDir, "migrations"));
	const pending = migrations.filter((m) => !applied.has(m.name));

	for (const m of pending) {
		await db.batch([
			...m.queries.map((q) => db.prepare(q)),
			db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(m.name),
		]);
		console.info(`applied ${m.name}`);
	}
	console.info(pending.length === 0 ? "no pending migrations" : `${pending.length} applied`);
} finally {
	await mf.dispose();
}
