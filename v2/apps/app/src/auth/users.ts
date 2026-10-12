import { uuidv7 } from "@kouden/domain";
import type { GoogleClaims } from "./google.ts";

export type ResolveOutcome = "existing" | "linked_legacy" | "created";

const MAX_DISPLAY_NAME = 50;

function defaultDisplayName(claims: GoogleClaims): string {
	const name = claims.name?.trim() || claims.email.split("@")[0] || "利用者";
	return name.slice(0, MAX_DISPLAY_NAME);
}

function isUniqueViolation(e: unknown): boolean {
	return e instanceof Error && /UNIQUE constraint failed/i.test(e.message);
}

/**
 * Google の属性からアプリのユーザーを特定する。
 *
 * 1. google_sub が一致するユーザー
 * 2. 旧アプリのメールログインユーザー（google_sub 未設定）で、確認済みメールが 1 件だけ一致 → 紐づける
 * 3. どちらもなければ新規作成
 */
export async function resolveUserFromGoogle(
	db: D1Database,
	claims: GoogleClaims,
	now: Date,
): Promise<{ userId: string; outcome: ResolveOutcome }> {
	try {
		return await resolveOnce(db, claims, now);
	} catch (e) {
		// 同じ人の初回ログインが同時に走ると google_sub の一意制約に当たる。もう一度引けば既存扱いになる
		if (isUniqueViolation(e)) return await resolveOnce(db, claims, now);
		throw e;
	}
}

async function resolveOnce(
	db: D1Database,
	claims: GoogleClaims,
	now: Date,
): Promise<{ userId: string; outcome: ResolveOutcome }> {
	const nowIso = now.toISOString();

	const existing = await db
		.prepare("SELECT id FROM users WHERE google_sub = ? AND deleted_at IS NULL")
		.bind(claims.sub)
		.first<{ id: string }>();
	if (existing) {
		await db
			.prepare("UPDATE users SET email = ?, avatar_url = ?, updated_at = ? WHERE id = ?")
			.bind(claims.email, claims.picture ?? null, nowIso, existing.id)
			.run();
		return { userId: existing.id, outcome: "existing" };
	}

	if (claims.emailVerified) {
		const { results } = await db
			.prepare(
				`SELECT id, legacy_user_id FROM users
          WHERE google_sub IS NULL AND legacy_user_id IS NOT NULL AND deleted_at IS NULL
            AND lower(email) = lower(?)
          LIMIT 2`,
			)
			.bind(claims.email)
			.all<{ id: string; legacy_user_id: string }>();
		// 2 件以上一致したら自動では判断しない（運営者による手動紐づけに回す）
		const [legacy] = results;
		if (results.length === 1 && legacy) {
			const [linked] = await db.batch([
				db
					.prepare(
						"UPDATE users SET google_sub = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ? AND google_sub IS NULL",
					)
					.bind(claims.sub, claims.email, claims.picture ?? null, nowIso, legacy.id),
				db
					.prepare(
						`UPDATE legacy_users SET linked_user_id = ?, linked_at = ?, linked_by = 'auto'
              WHERE legacy_user_id = ? AND linked_user_id IS NULL`,
					)
					.bind(legacy.id, nowIso, legacy.legacy_user_id),
			]);
			// 同時ログインで別の Google アカウントが先に紐づけた場合は 0 件になる。
			// その旧ユーザーとして扱わず、最初からやり直す（既存の sub で見つかるか、新規作成になる）
			if (linked?.meta.changes !== 1) return await resolveOnce(db, claims, now);
			return { userId: legacy.id, outcome: "linked_legacy" };
		}
	}

	const id = uuidv7(now.getTime());
	await db.batch([
		// 削除済みアカウントが同じ google_sub を持っていると一意制約に当たるので、手放させる。
		// 削除済みアカウントは復活させず、新しい空のアカウントとして登録する
		db
			.prepare("UPDATE users SET google_sub = NULL WHERE google_sub = ? AND deleted_at IS NOT NULL")
			.bind(claims.sub),
		db
			.prepare(
				`INSERT INTO users (id, google_sub, email, display_name, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				id,
				claims.sub,
				claims.email,
				defaultDisplayName(claims),
				claims.picture ?? null,
				nowIso,
				nowIso,
			),
	]);
	return { userId: id, outcome: "created" };
}
