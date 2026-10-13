import type { ImportKoudenPayload, ImportUser } from "@kouden/domain";

/**
 * 旧アプリからのデータ移行の D1 への書き込み（05 §2 の 3a）。
 * 何度実行しても同じ結果になるよう、行は ID で上書きする（INSERT OR REPLACE は行を消して入れ直し、
 * ON DELETE CASCADE で関連する行まで消えるので使わない）。
 */

/** 旧ユーザーを登録する。Google でログインしていた人は google_sub で、メールログインだった人は初回ログイン時に紐づく（ADR-P17） */
export async function importUsers(db: D1Database, users: ImportUser[], at: string): Promise<void> {
	if (users.length === 0) return;
	const statements = users.flatMap((u) => [
		db
			.prepare(
				// 取り込みの後に紐づいた google_sub は、再実行で消さない
				`INSERT INTO users (id, google_sub, email, display_name, legacy_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           google_sub = coalesce(excluded.google_sub, users.google_sub),
           email = excluded.email, display_name = excluded.display_name,
           legacy_user_id = excluded.legacy_user_id, updated_at = excluded.updated_at`,
			)
			.bind(u.id, u.googleSub, u.email, u.displayName, u.legacyUserId, u.createdAt, at),
		db
			.prepare(
				// Google でログインしていた人は、取り込んだ時点で紐づいている。運営者による手動の紐づけは再実行で消さない
				`INSERT INTO legacy_users (legacy_user_id, email, display_name, auth_provider, linked_user_id, linked_at, linked_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (legacy_user_id) DO UPDATE SET
           email = excluded.email, display_name = excluded.display_name, auth_provider = excluded.auth_provider`,
			)
			.bind(
				u.legacyUserId,
				u.email,
				u.displayName,
				u.googleSub === null ? "email" : "google",
				u.googleSub === null ? null : u.id,
				u.googleSub === null ? null : at,
				u.googleSub === null ? null : "import",
			),
	]);
	await db.batch(statements);
}

/** 香典帳・メンバー・購入を登録する（台帳は DO に別に取り込む）。メンバーは入れ直す */
export async function importKoudenRows(
	db: D1Database,
	koudenId: string,
	payload: Omit<ImportKoudenPayload, "ledger">,
	at: string,
): Promise<void> {
	const k = payload.kouden;
	await db.batch([
		db
			.prepare(
				// 移行した香典帳はすべて有料版（ADR-P10）
				`INSERT INTO koudens (id, title, deceased_name, owner_user_id, plan, status, legacy_kouden_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           title = excluded.title, deceased_name = excluded.deceased_name,
           owner_user_id = excluded.owner_user_id, plan = 'paid', status = excluded.status,
           legacy_kouden_id = excluded.legacy_kouden_id, updated_at = excluded.updated_at`,
			)
			.bind(
				koudenId,
				k.title,
				k.deceasedName,
				k.ownerUserId,
				k.status,
				k.legacyKoudenId,
				k.createdAt,
				at,
			),
		db.prepare("DELETE FROM kouden_members WHERE kouden_id = ?").bind(koudenId),
		...payload.members.map((m) =>
			db
				.prepare(
					`INSERT INTO kouden_members (kouden_id, user_id, role, joined_at, invited_by)
           VALUES (?, ?, ?, ?, ?)`,
				)
				.bind(koudenId, m.userId, m.role, m.joinedAt, m.invitedBy),
		),
		...payload.purchases.map((p) =>
			db
				.prepare(
					`INSERT INTO purchases (id, kouden_id, user_id, amount, stripe_checkout_session_id, source, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'legacy', 'paid', ?)
           ON CONFLICT (id) DO UPDATE SET
             kouden_id = excluded.kouden_id, user_id = excluded.user_id, amount = excluded.amount,
             stripe_checkout_session_id = excluded.stripe_checkout_session_id, created_at = excluded.created_at`,
				)
				.bind(p.id, koudenId, p.userId, p.amount, p.stripeCheckoutSessionId, p.createdAt),
		),
	]);
}

/** 検証用（05 §5）: D1 側の香典帳の内容 */
export async function koudenImportState(db: D1Database, koudenId: string) {
	const kouden = await db
		.prepare("SELECT owner_user_id, plan, status, legacy_kouden_id FROM koudens WHERE id = ?")
		.bind(koudenId)
		.first<{
			owner_user_id: string;
			plan: string;
			status: string;
			legacy_kouden_id: string | null;
		}>();
	if (!kouden) return null;
	const [members, purchases] = await db.batch<{ role: string; n: number }>([
		db
			.prepare("SELECT role, count(*) AS n FROM kouden_members WHERE kouden_id = ? GROUP BY role")
			.bind(koudenId),
		db
			.prepare(
				"SELECT 'paid' AS role, count(*) AS n FROM purchases WHERE kouden_id = ? AND status = 'paid'",
			)
			.bind(koudenId),
	]);
	const roles = Object.fromEntries((members?.results ?? []).map((r) => [r.role, r.n]));
	return {
		ownerUserId: kouden.owner_user_id,
		plan: kouden.plan,
		status: kouden.status,
		legacyKoudenId: kouden.legacy_kouden_id,
		members: { owner: roles.owner ?? 0, editor: roles.editor ?? 0, viewer: roles.viewer ?? 0 },
		paidPurchases: purchases?.results[0]?.n ?? 0,
	};
}
