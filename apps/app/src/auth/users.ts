import { uuidv7 } from "@kouden/domain";
import type { GoogleClaims } from "./google.ts";

export type ResolveOutcome = "existing" | "linked_legacy" | "created";

const MAX_DISPLAY_NAME = 50;

/** Google が持ち主を管理している個人向けドメイン */
const GOOGLE_CONSUMER_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * このメールアドレスの持ち主を Google が保証できるか（ADR-P17）。
 *
 * `email_verified` は「Google アカウント作成時に確認した」ことしか示さず、Gmail 以外の
 * アドレスは後から別人に再割り当てされうる。Gmail と、Google Workspace のドメイン
 * （`hd` クレームがメールのドメインと一致）だけを、旧アカウントへの自動紐づけに使う。
 */
export function isEmailAuthoritative(claims: GoogleClaims): boolean {
	if (!claims.emailVerified) return false;
	const domain = claims.email.split("@").pop()?.toLowerCase();
	if (!domain) return false;
	if (GOOGLE_CONSUMER_DOMAINS.has(domain)) return true;
	return claims.hostedDomain !== undefined && claims.hostedDomain.toLowerCase() === domain;
}

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
 * 2. 旧アプリのメールログインユーザー（google_sub 未設定・未紐づけ）で、Google が持ち主を保証できる
 *    メール（Gmail / Google Workspace）が 1 件だけ一致 → 紐づける。それ以外は運営者が手動で紐づける
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

	if (isEmailAuthoritative(claims)) {
		const { results } = await db
			.prepare(
				// 運営者が手動で紐づけ済み（legacy_users.linked_user_id あり）の旧ユーザーは対象外
				`SELECT u.id, u.legacy_user_id FROM users u
           JOIN legacy_users l ON l.legacy_user_id = u.legacy_user_id
          WHERE u.google_sub IS NULL AND u.legacy_user_id IS NOT NULL AND u.deleted_at IS NULL
            AND l.linked_user_id IS NULL
            AND lower(u.email) = lower(?)
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
						// 未紐づけであることを同じトランザクション内で再確認する（SELECT 後の競合対策）
						`UPDATE users SET google_sub = ?, email = ?, avatar_url = ?, updated_at = ?
              WHERE id = ? AND google_sub IS NULL
                AND EXISTS (SELECT 1 FROM legacy_users WHERE legacy_user_id = ? AND linked_user_id IS NULL)`,
					)
					.bind(
						claims.sub,
						claims.email,
						claims.picture ?? null,
						nowIso,
						legacy.id,
						legacy.legacy_user_id,
					),
				db
					.prepare(
						`UPDATE legacy_users SET linked_user_id = ?, linked_at = ?, linked_by = 'auto'
              WHERE legacy_user_id = ? AND linked_user_id IS NULL`,
					)
					.bind(legacy.id, nowIso, legacy.legacy_user_id),
			]);
			// 同時ログインで別の Google アカウントが先に紐づけた場合や、直前に運営者が手動で紐づけた場合は 0 件になる。
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
