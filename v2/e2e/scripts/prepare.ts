/**
 * E2E の前準備。専用の保存先（.state）を作り直し、D1 にマイグレーションを当てて、
 * tests/users.ts の利用者とセッションを入れる。開発サーバーを起動する前に実行する。
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { LOCAL_D1_ID } from "../../apps/app/deploy.settings.ts";
import { USERS } from "../tests/users.ts";
import { STATE_DIR } from "./state.ts";

const appDir = path.resolve(import.meta.dirname, "../../apps/app");

rmSync(STATE_DIR, { recursive: true, force: true });

const migrated = spawnSync("bun", ["run", "db:migrate:local"], {
	cwd: appDir,
	env: { ...process.env, KOUDEN_LOCAL_STATE: STATE_DIR },
	stdio: "inherit",
});
if (migrated.status !== 0) process.exit(migrated.status ?? 1);

const sha256Hex = async (s: string) =>
	Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).toString("hex");

const mf = new Miniflare({
	...convertV4MiniflareOptions({
		modules: true,
		script: "export default {}",
		d1Databases: { DB: LOCAL_D1_ID },
	}),
	resourcePersistencePath: path.join(STATE_DIR, "v3"),
	resourceTmpPath: path.join(STATE_DIR, "tmp"),
	telemetry: { enabled: false },
});

try {
	const db = await mf.getD1Database("DB");
	const now = new Date();
	const at = now.toISOString();
	const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
	const statements = [];
	for (const [key, u] of Object.entries(USERS)) {
		statements.push(
			db
				.prepare(
					`INSERT INTO users (id, google_sub, email, display_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
				)
				.bind(u.id, `e2e-sub-${key}`, u.email, u.name, at, at),
			db
				.prepare(
					`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?)`,
				)
				.bind(await sha256Hex(u.token), u.id, at, expires, at),
		);
	}
	await db.batch(statements);
	console.info(`seeded ${Object.keys(USERS).length} users`);
} finally {
	await mf.dispose();
}
