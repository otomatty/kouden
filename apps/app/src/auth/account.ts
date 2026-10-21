import type { Plan, Role } from "@kouden/domain";

/**
 * アカウント（E1-4, E1-5）。D1 の users と、削除に伴うメンバー行・セッション・譲渡の後始末。
 * 削除は 03 §8 のとおり、行は残して匿名化する（香典帳・招待・譲渡の記録が users を参照しているため）。
 */

/** 削除したアカウントの表示名（メンバー一覧などからは消えるが、参照が残る箇所で使われる） */
export const DELETED_USER_NAME = "退会したユーザー";

export async function updateDisplayName(
	db: D1Database,
	userId: string,
	displayName: string,
	now: Date,
): Promise<void> {
	await db
		.prepare(
			"UPDATE users SET display_name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
		)
		.bind(displayName, now.toISOString(), userId)
		.run();
}

export interface OwnedKouden {
	id: string;
	title: string;
	status: "active" | "archived";
	/** 承諾待ちの譲渡があるか */
	transferPending: boolean;
}

/** オーナーである香典帳（削除中のものを除く）。1 冊でもあればアカウントを削除できない */
export async function ownedKoudens(
	db: D1Database,
	userId: string,
	now: Date,
): Promise<OwnedKouden[]> {
	const { results } = await db
		.prepare(
			`SELECT k.id, k.title, k.status,
              EXISTS (SELECT 1 FROM ownership_transfers t
                       WHERE t.kouden_id = k.id AND t.status = 'pending' AND t.expires_at > ?) AS pending
         FROM koudens k
        WHERE k.owner_user_id = ? AND k.status IN ('active', 'archived')
        ORDER BY k.created_at`,
		)
		.bind(now.toISOString(), userId)
		.all<{ id: string; title: string; status: "active" | "archived"; pending: number }>();
	return results.map((r) => ({
		id: r.id,
		title: r.title,
		status: r.status,
		transferPending: r.pending === 1,
	}));
}

export interface Membership {
	koudenId: string;
	role: Role;
	plan: Plan;
}

/** メンバーとして参加している香典帳（削除後に、開いている画面の接続を切るために使う） */
export async function membershipsOf(db: D1Database, userId: string): Promise<Membership[]> {
	const { results } = await db
		.prepare(
			`SELECT m.kouden_id, m.role, k.plan
         FROM kouden_members m JOIN koudens k ON k.id = m.kouden_id
        WHERE m.user_id = ? AND k.status IN ('active', 'archived')`,
		)
		.bind(userId)
		.all<{ kouden_id: string; role: Role; plan: Plan }>();
	return results.map((r) => ({ koudenId: r.kouden_id, role: r.role, plan: r.plan }));
}

/**
 * アカウントを削除する（03 §8）。オーナーである香典帳が残っていれば何もせず false を返す。
 * 1 つの batch で、匿名化（deleted_at・メール・名前・google_sub）→ メンバー行・セッションの削除 →
 * 承諾待ちの譲渡の取り消しを行う。後続の文は「この要求で匿名化した」ことを条件にする
 */
export async function deleteAccount(db: D1Database, userId: string, now: Date): Promise<boolean> {
	const at = now.toISOString();
	const deletedNow = "EXISTS (SELECT 1 FROM users WHERE id = ?1 AND deleted_at = ?2)";
	const [anonymized] = await db.batch([
		db
			.prepare(
				`UPDATE users
            SET deleted_at = ?2, updated_at = ?2, email = '', display_name = ?3,
                google_sub = NULL, avatar_url = NULL
          WHERE id = ?1 AND deleted_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM koudens
                             WHERE owner_user_id = ?1 AND status IN ('active', 'archived'))`,
			)
			.bind(userId, at, DELETED_USER_NAME),
		db.prepare(`DELETE FROM kouden_members WHERE user_id = ?1 AND ${deletedNow}`).bind(userId, at),
		db.prepare(`DELETE FROM sessions WHERE user_id = ?1 AND ${deletedNow}`).bind(userId, at),
		db
			.prepare(
				`UPDATE ownership_transfers SET status = 'cancelled', resolved_at = ?2
          WHERE status = 'pending' AND (from_user_id = ?1 OR to_user_id = ?1) AND ${deletedNow}`,
			)
			.bind(userId, at),
	]);
	return (anonymized?.meta.changes ?? 0) === 1;
}
