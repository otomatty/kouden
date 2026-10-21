import { randomToken, sha256Hex } from "../lib/crypto.ts";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** last_seen_at / expires_at の更新は 1 日 1 回まで（書き込みを減らす） */
const TOUCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
}

export interface LoadedSession {
	user: SessionUser;
	/** 有効期限を延長した場合 true（Cookie の Max-Age も更新する） */
	extended: boolean;
}

export async function createSession(
	db: D1Database,
	userId: string,
	now: Date,
	userAgent: string | null,
): Promise<string> {
	const token = randomToken();
	const nowIso = now.toISOString();
	await db
		.prepare(
			`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			await sha256Hex(token),
			userId,
			nowIso,
			new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
			nowIso,
			userAgent?.slice(0, 200) ?? null,
		)
		.run();
	return token;
}

export async function loadSession(
	db: D1Database,
	token: string,
	now: Date,
): Promise<LoadedSession | null> {
	const tokenHash = await sha256Hex(token);
	const row = await db
		.prepare(
			`SELECT s.last_seen_at, u.id, u.email, u.display_name, u.avatar_url
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ? AND u.deleted_at IS NULL`,
		)
		.bind(tokenHash, now.toISOString())
		.first<{
			last_seen_at: string;
			id: string;
			email: string;
			display_name: string;
			avatar_url: string | null;
		}>();
	if (!row) return null;

	let extended = false;
	if (now.getTime() - Date.parse(row.last_seen_at) >= TOUCH_INTERVAL_MS) {
		await db
			.prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?")
			.bind(now.toISOString(), new Date(now.getTime() + SESSION_TTL_MS).toISOString(), tokenHash)
			.run();
		extended = true;
	}

	return {
		user: {
			id: row.id,
			email: row.email,
			displayName: row.display_name,
			avatarUrl: row.avatar_url,
		},
		extended,
	};
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE token_hash = ?")
		.bind(await sha256Hex(token))
		.run();
}

export async function deleteAllSessions(db: D1Database, userId: string): Promise<void> {
	await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

export async function deleteExpiredSessions(db: D1Database, now: Date): Promise<number> {
	const res = await db
		.prepare("DELETE FROM sessions WHERE expires_at <= ?")
		.bind(now.toISOString())
		.run();
	return res.meta.changes;
}
