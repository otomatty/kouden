/**
 * 切り戻しリハーサル用に、ローカル D1（KOUDEN_LOCAL_STATE）へログインセッションを作る。
 * Google ログインを使わずに、移行済みのユーザーや新しいユーザーとして画面を操作するため。
 * 出力は ID と Cookie の値だけで、氏名・メールは出さない。
 *
 *   bun scripts/rehearsal-session.ts kouden <旧香典帳ID>   v2 の香典帳 ID とメンバー（user_id・role）
 *   bun scripts/rehearsal-session.ts session <user_id>     そのユーザーのセッション
 *   bun scripts/rehearsal-session.ts new-user              legacy_user_id のない新しいユーザーとセッション
 *
 * Cookie `__Host-kouden_session` に出力された token を設定する（Secure・Path=/）。
 */
import path from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { LOCAL_D1_ID } from "../deploy.settings.ts";
import { randomToken, sha256Hex } from "../src/lib/crypto.ts";

const stateDir = process.env.KOUDEN_LOCAL_STATE;
if (!stateDir) throw new Error("KOUDEN_LOCAL_STATE を設定してください（リハーサル専用の保存先）");

const [command, arg] = process.argv.slice(2);
const appDir = path.resolve(import.meta.dirname, "..");
const mf = new Miniflare({
	...convertV4MiniflareOptions({
		modules: true,
		script: "export default {}",
		d1Databases: { DB: LOCAL_D1_ID },
	}),
	resourcePersistencePath: path.join(stateDir, "v3"),
	resourceTmpPath: path.join(appDir, ".cloudflare/tmp"),
	telemetry: { enabled: false },
});

async function createSession(db: Awaited<ReturnType<Miniflare["getD1Database"]>>, userId: string) {
	const token = randomToken();
	const now = new Date();
	await db
		.prepare(
			"INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)",
		)
		.bind(
			await sha256Hex(token),
			userId,
			now.toISOString(),
			new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
			now.toISOString(),
		)
		.run();
	return token;
}

try {
	const db = await mf.getD1Database("DB");
	if (command === "kouden" && arg) {
		const kouden = await db
			.prepare("SELECT id, owner_user_id FROM koudens WHERE legacy_kouden_id = ?")
			.bind(arg)
			.first();
		if (!kouden) throw new Error("移行済みの香典帳が見つかりません");
		const { results } = await db
			.prepare(
				"SELECT m.user_id, m.role, u.legacy_user_id FROM kouden_members m JOIN users u ON u.id = m.user_id WHERE m.kouden_id = ? ORDER BY m.role, m.user_id",
			)
			.bind(kouden.id)
			.all();
		console.info(JSON.stringify({ kouden, members: results }, null, 2));
	} else if (command === "session" && arg) {
		console.info(JSON.stringify({ userId: arg, token: await createSession(db, arg) }));
	} else if (command === "new-user") {
		const id = crypto.randomUUID();
		const at = new Date().toISOString();
		await db
			.prepare(
				"INSERT INTO users (id, google_sub, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			)
			.bind(
				id,
				`rehearsal-${id}`,
				`rehearsal-${id.slice(0, 8)}@example.test`,
				"リハーサル新規",
				at,
				at,
			)
			.run();
		console.info(JSON.stringify({ userId: id, token: await createSession(db, id) }));
	} else {
		throw new Error("使い方: kouden <旧香典帳ID> | session <user_id> | new-user");
	}
} finally {
	await mf.dispose();
}
