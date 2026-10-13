import { escapeLike, type Plan, type Role, uuidv7 } from "@kouden/domain";

/**
 * 運営者画面の D1 の読み書き（E10）。香典帳の中身（差出人の個人情報）は DO にあり、ここからは読まない。
 * 書き込みは監査ログ（admin_audit_logs）と同じ batch で記録する。
 */

// ---- 監査ログ -----------------------------------------------------------------

export interface AuditEntry {
	adminEmail: string;
	action: string;
	targetType: string;
	targetId: string;
	detail?: Record<string, unknown>;
}

/** 監査ログを書く文。guard を渡すと、その条件が成り立つときだけ書く（操作が実際に行われた場合だけ残す） */
function auditStatement(
	db: D1Database,
	entry: AuditEntry,
	at: string,
	guard?: { sql: string; params: unknown[] },
): D1PreparedStatement {
	const values = [
		uuidv7(Date.parse(at)),
		entry.adminEmail,
		entry.action,
		entry.targetType,
		entry.targetId,
		entry.detail ? JSON.stringify(entry.detail) : null,
		at,
	];
	if (!guard) {
		return db
			.prepare(
				`INSERT INTO admin_audit_logs (id, admin_email, action, target_type, target_id, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(...values);
	}
	return db
		.prepare(
			`INSERT INTO admin_audit_logs (id, admin_email, action, target_type, target_id, detail, created_at)
       SELECT ?, ?, ?, ?, ?, ?, ? WHERE ${guard.sql}`,
		)
		.bind(...values, ...guard.params);
}

/** 直前の文（同じ batch の 1 つ前）が 1 行を変更した場合だけ、という条件 */
const CHANGED_JUST_NOW = { sql: "changes() = 1", params: [] };

export interface AuditLog {
	id: string;
	adminEmail: string;
	action: string;
	targetType: string;
	targetId: string;
	detail: string | null;
	createdAt: string;
}

export async function auditLogs(db: D1Database, limit = 200): Promise<AuditLog[]> {
	const { results } = await db
		.prepare(
			`SELECT id, admin_email, action, target_type, target_id, detail, created_at
         FROM admin_audit_logs ORDER BY created_at DESC, id DESC LIMIT ?`,
		)
		.bind(limit)
		.all<{
			id: string;
			admin_email: string;
			action: string;
			target_type: string;
			target_id: string;
			detail: string | null;
			created_at: string;
		}>();
	return results.map((r) => ({
		id: r.id,
		adminEmail: r.admin_email,
		action: r.action,
		targetType: r.target_type,
		targetId: r.target_id,
		detail: r.detail,
		createdAt: r.created_at,
	}));
}

// ---- ダッシュボード（E10-4） ----------------------------------------------------

export interface MonthRow {
	month: string;
	users: number;
	koudens: number;
	purchases: number;
	revenue: number;
}

export interface Dashboard {
	users: number;
	koudens: { active: number; archived: number; paid: number };
	purchases: { paid: number; refunded: number; revenue: number };
	/** 統計の投影（kouden_stats）の合計 */
	activity: { gifts: number; returnPending: number; activeLast30Days: number };
	/** 直近 12 か月（日本時間の月）。新しい月が先 */
	months: MonthRow[];
}

/** 日本時間の「YYYY-MM」 */
const jstMonth = (d: Date) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 7);

const byMonthMap = (res: D1Result | undefined) =>
	new Map(
		((res?.results ?? []) as { month: string; n: number; revenue?: number }[]).map((r) => [
			r.month,
			r,
		]),
	);

export async function dashboard(db: D1Database, now: Date): Promise<Dashboard> {
	const months: string[] = [];
	const cursor = new Date(`${jstMonth(now)}-01T00:00:00Z`);
	for (let i = 0; i < 12; i++) {
		months.push(cursor.toISOString().slice(0, 7));
		cursor.setUTCMonth(cursor.getUTCMonth() - 1);
	}
	const oldest = months.at(-1) ?? jstMonth(now);
	// 日本時間の月初 = UTC の前日 15:00
	const since = new Date(Date.parse(`${oldest}-01T00:00:00Z`) - 9 * 3600_000).toISOString();
	const recent = new Date(now.getTime() - 30 * 86400_000).toISOString();

	const byMonth = (table: string, extra = "") =>
		db
			.prepare(
				`SELECT strftime('%Y-%m', created_at, '+9 hours') AS month, count(*) AS n
           FROM ${table} WHERE created_at >= ? ${extra} GROUP BY month`,
			)
			.bind(since);

	const [totals, usersByMonth, koudensByMonth, purchasesByMonth] = await db.batch([
		db
			.prepare(
				`SELECT
           (SELECT count(*) FROM users WHERE deleted_at IS NULL) AS users,
           (SELECT count(*) FROM koudens WHERE status = 'active') AS active,
           (SELECT count(*) FROM koudens WHERE status = 'archived') AS archived,
           (SELECT count(*) FROM koudens WHERE status IN ('active', 'archived') AND plan = 'paid') AS paid,
           (SELECT count(*) FROM purchases WHERE status = 'paid') AS purchases_paid,
           (SELECT count(*) FROM purchases WHERE status = 'refunded') AS purchases_refunded,
           (SELECT coalesce(sum(amount), 0) FROM purchases WHERE status = 'paid' AND source = 'stripe') AS revenue,
           (SELECT coalesce(sum(gift_count), 0) FROM kouden_stats) AS gifts,
           (SELECT coalesce(sum(return_pending), 0) FROM kouden_stats) AS return_pending,
           (SELECT count(*) FROM kouden_stats WHERE last_activity_at >= ?) AS active_30`,
			)
			.bind(recent),
		byMonth("users"),
		byMonth("koudens"),
		db
			.prepare(
				`SELECT strftime('%Y-%m', created_at, '+9 hours') AS month, count(*) AS n,
                coalesce(sum(amount), 0) AS revenue
           FROM purchases WHERE created_at >= ? AND source = 'stripe' AND status = 'paid'
          GROUP BY month`,
			)
			.bind(since),
	]);
	const t = (totals?.results[0] ?? {}) as Record<string, number>;
	const u = byMonthMap(usersByMonth);
	const k = byMonthMap(koudensByMonth);
	const p = byMonthMap(purchasesByMonth);
	return {
		users: t.users ?? 0,
		koudens: { active: t.active ?? 0, archived: t.archived ?? 0, paid: t.paid ?? 0 },
		purchases: {
			paid: t.purchases_paid ?? 0,
			refunded: t.purchases_refunded ?? 0,
			revenue: t.revenue ?? 0,
		},
		activity: {
			gifts: t.gifts ?? 0,
			returnPending: t.return_pending ?? 0,
			activeLast30Days: t.active_30 ?? 0,
		},
		months: months.map((month) => ({
			month,
			users: u.get(month)?.n ?? 0,
			koudens: k.get(month)?.n ?? 0,
			purchases: p.get(month)?.n ?? 0,
			revenue: p.get(month)?.revenue ?? 0,
		})),
	};
}

// ---- 検索（E10-1） --------------------------------------------------------------

export interface UserRow {
	id: string;
	email: string;
	displayName: string;
	createdAt: string;
	deletedAt: string | null;
	legacyUserId: string | null;
	googleLinked: boolean;
	koudenCount: number;
}

export interface KoudenRow {
	id: string;
	title: string;
	ownerName: string;
	ownerEmail: string;
	plan: Plan;
	status: "active" | "archived" | "deleting";
	createdAt: string;
	giftCount: number | null;
	lastActivityAt: string | null;
}

const likeOf = (q: string) => `%${escapeLike(q)}%`;

export async function searchUsers(db: D1Database, q: string, limit = 50): Promise<UserRow[]> {
	const { results } = await db
		.prepare(
			`SELECT u.id, u.email, u.display_name, u.created_at, u.deleted_at, u.legacy_user_id,
              u.google_sub IS NOT NULL AS google_linked,
              (SELECT count(*) FROM kouden_members m WHERE m.user_id = u.id) AS kouden_count
         FROM users u
        WHERE u.email LIKE ?1 ESCAPE '\\' OR u.display_name LIKE ?1 ESCAPE '\\' OR u.id = ?2
        ORDER BY u.created_at DESC LIMIT ?3`,
		)
		.bind(likeOf(q), q, limit)
		.all<{
			id: string;
			email: string;
			display_name: string;
			created_at: string;
			deleted_at: string | null;
			legacy_user_id: string | null;
			google_linked: number;
			kouden_count: number;
		}>();
	return results.map(toUserRow);
}

function toUserRow(r: {
	id: string;
	email: string;
	display_name: string;
	created_at: string;
	deleted_at: string | null;
	legacy_user_id: string | null;
	google_linked: number;
	kouden_count: number;
}): UserRow {
	return {
		id: r.id,
		email: r.email,
		displayName: r.display_name,
		createdAt: r.created_at,
		deletedAt: r.deleted_at,
		legacyUserId: r.legacy_user_id,
		googleLinked: r.google_linked === 1,
		koudenCount: r.kouden_count,
	};
}

const KOUDEN_COLUMNS = `k.id, k.title, k.plan, k.status, k.created_at,
       o.display_name AS owner_name, o.email AS owner_email,
       s.gift_count, s.last_activity_at`;

type KoudenSqlRow = {
	id: string;
	title: string;
	plan: Plan;
	status: KoudenRow["status"];
	created_at: string;
	owner_name: string;
	owner_email: string;
	gift_count: number | null;
	last_activity_at: string | null;
};

const toKoudenRow = (r: KoudenSqlRow): KoudenRow => ({
	id: r.id,
	title: r.title,
	ownerName: r.owner_name,
	ownerEmail: r.owner_email,
	plan: r.plan,
	status: r.status,
	createdAt: r.created_at,
	giftCount: r.gift_count,
	lastActivityAt: r.last_activity_at,
});

export async function searchKoudens(db: D1Database, q: string, limit = 50): Promise<KoudenRow[]> {
	const { results } = await db
		.prepare(
			`SELECT ${KOUDEN_COLUMNS}
         FROM koudens k
         JOIN users o ON o.id = k.owner_user_id
         LEFT JOIN kouden_stats s ON s.kouden_id = k.id
        WHERE k.title LIKE ?1 ESCAPE '\\' OR k.id = ?2 OR o.email LIKE ?1 ESCAPE '\\'
        ORDER BY k.created_at DESC LIMIT ?3`,
		)
		.bind(likeOf(q), q, limit)
		.all<KoudenSqlRow>();
	return results.map(toKoudenRow);
}

export interface PurchaseRow {
	id: string;
	koudenId: string;
	koudenTitle: string | null;
	buyerName: string | null;
	amount: number;
	source: "stripe" | "legacy" | "admin";
	status: "paid" | "refunded";
	stripeCheckoutSessionId: string | null;
	createdAt: string;
	refundedAt: string | null;
}

const PURCHASE_COLUMNS = `p.id, p.kouden_id, k.title AS kouden_title, u.display_name AS buyer_name,
       p.amount, p.source, p.status, p.stripe_checkout_session_id, p.created_at, p.refunded_at`;

type PurchaseSqlRow = {
	id: string;
	kouden_id: string;
	kouden_title: string | null;
	buyer_name: string | null;
	amount: number;
	source: PurchaseRow["source"];
	status: PurchaseRow["status"];
	stripe_checkout_session_id: string | null;
	created_at: string;
	refunded_at: string | null;
};

const toPurchaseRow = (r: PurchaseSqlRow): PurchaseRow => ({
	id: r.id,
	koudenId: r.kouden_id,
	koudenTitle: r.kouden_title,
	buyerName: r.buyer_name,
	amount: r.amount,
	source: r.source,
	status: r.status,
	stripeCheckoutSessionId: r.stripe_checkout_session_id,
	createdAt: r.created_at,
	refundedAt: r.refunded_at,
});

export interface UserDetail extends UserRow {
	memberships: { koudenId: string; title: string; role: Role; plan: Plan; status: string }[];
	purchases: PurchaseRow[];
	legacy: {
		email: string;
		authProvider: string;
		linkedAt: string | null;
		linkedBy: string | null;
	} | null;
}

export async function userDetail(db: D1Database, userId: string): Promise<UserDetail | null> {
	const [user, memberships, purchases, legacy] = await db.batch([
		db
			.prepare(
				`SELECT u.id, u.email, u.display_name, u.created_at, u.deleted_at, u.legacy_user_id,
                u.google_sub IS NOT NULL AS google_linked,
                (SELECT count(*) FROM kouden_members m WHERE m.user_id = u.id) AS kouden_count
           FROM users u WHERE u.id = ?`,
			)
			.bind(userId),
		db
			.prepare(
				`SELECT m.kouden_id, k.title, m.role, k.plan, k.status
           FROM kouden_members m JOIN koudens k ON k.id = m.kouden_id
          WHERE m.user_id = ? ORDER BY k.created_at DESC`,
			)
			.bind(userId),
		db
			.prepare(
				`SELECT ${PURCHASE_COLUMNS}
           FROM purchases p LEFT JOIN koudens k ON k.id = p.kouden_id LEFT JOIN users u ON u.id = p.user_id
          WHERE p.user_id = ? ORDER BY p.created_at DESC`,
			)
			.bind(userId),
		db
			.prepare(
				`SELECT l.email, l.auth_provider, l.linked_at, l.linked_by
           FROM legacy_users l
          WHERE l.linked_user_id = ?1
             OR l.legacy_user_id = (SELECT legacy_user_id FROM users WHERE id = ?1)
          LIMIT 1`,
			)
			.bind(userId),
	]);
	const row = user?.results[0] as Parameters<typeof toUserRow>[0] | undefined;
	if (!row) return null;
	const l = legacy?.results[0] as
		| { email: string; auth_provider: string; linked_at: string | null; linked_by: string | null }
		| undefined;
	return {
		...toUserRow(row),
		memberships: (
			(memberships?.results ?? []) as {
				kouden_id: string;
				title: string;
				role: Role;
				plan: Plan;
				status: string;
			}[]
		).map((m) => ({
			koudenId: m.kouden_id,
			title: m.title,
			role: m.role,
			plan: m.plan,
			status: m.status,
		})),
		purchases: ((purchases?.results ?? []) as PurchaseSqlRow[]).map(toPurchaseRow),
		legacy: l
			? {
					email: l.email,
					authProvider: l.auth_provider,
					linkedAt: l.linked_at,
					linkedBy: l.linked_by,
				}
			: null,
	};
}

export interface KoudenDetail extends KoudenRow {
	deceasedName: string;
	ownerId: string;
	personCount: number | null;
	returnPending: number | null;
	members: { userId: string; displayName: string; email: string; role: Role; joinedAt: string }[];
	purchases: PurchaseRow[];
}

export async function koudenDetail(db: D1Database, koudenId: string): Promise<KoudenDetail | null> {
	const [kouden, members, purchases] = await db.batch([
		db
			.prepare(
				`SELECT ${KOUDEN_COLUMNS}, k.deceased_name, k.owner_user_id, s.person_count, s.return_pending
           FROM koudens k
           JOIN users o ON o.id = k.owner_user_id
           LEFT JOIN kouden_stats s ON s.kouden_id = k.id
          WHERE k.id = ?`,
			)
			.bind(koudenId),
		db
			.prepare(
				`SELECT m.user_id, u.display_name, u.email, m.role, m.joined_at
           FROM kouden_members m JOIN users u ON u.id = m.user_id
          WHERE m.kouden_id = ?
          ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, m.joined_at`,
			)
			.bind(koudenId),
		db
			.prepare(
				`SELECT ${PURCHASE_COLUMNS}
           FROM purchases p LEFT JOIN koudens k ON k.id = p.kouden_id LEFT JOIN users u ON u.id = p.user_id
          WHERE p.kouden_id = ? ORDER BY p.created_at DESC`,
			)
			.bind(koudenId),
	]);
	const row = kouden?.results[0] as
		| (KoudenSqlRow & {
				deceased_name: string;
				owner_user_id: string;
				person_count: number | null;
				return_pending: number | null;
		  })
		| undefined;
	if (!row) return null;
	return {
		...toKoudenRow(row),
		deceasedName: row.deceased_name,
		ownerId: row.owner_user_id,
		personCount: row.person_count,
		returnPending: row.return_pending,
		members: (
			(members?.results ?? []) as {
				user_id: string;
				display_name: string;
				email: string;
				role: Role;
				joined_at: string;
			}[]
		).map((m) => ({
			userId: m.user_id,
			displayName: m.display_name,
			email: m.email,
			role: m.role,
			joinedAt: m.joined_at,
		})),
		purchases: ((purchases?.results ?? []) as PurchaseSqlRow[]).map(toPurchaseRow),
	};
}

// ---- 有料化・購入の取り消し（E10-3） ----------------------------------------------

export type GrantResult = { ok: true } | { ok: false; reason: "not_found" | "already_paid" };

/**
 * 運営者が手動で有料にする（返金ではない救済・不具合の補償など）。金額 0 円・source = 'admin' の購入を記録する。
 * 不変条件「plan = 'paid' ⇔ 有効な購入がある」を保つため、購入と plan を同じ batch で更新する
 */
export async function grantPaid(
	db: D1Database,
	input: { koudenId: string; reason: string; adminEmail: string },
	now: Date,
): Promise<GrantResult> {
	const kouden = await db
		.prepare(
			"SELECT owner_user_id, plan FROM koudens WHERE id = ? AND status IN ('active', 'archived')",
		)
		.bind(input.koudenId)
		.first<{ owner_user_id: string; plan: Plan }>();
	if (!kouden) return { ok: false, reason: "not_found" };
	if (kouden.plan === "paid") return { ok: false, reason: "already_paid" };
	const at = now.toISOString();
	const purchaseId = uuidv7(now.getTime());
	const [, upgraded] = await db.batch([
		db
			.prepare(
				`INSERT INTO purchases (id, kouden_id, user_id, amount, currency, source, status, created_at)
         SELECT ?, ?, ?, 0, 'jpy', 'admin', 'paid', ?
          WHERE EXISTS (SELECT 1 FROM koudens WHERE id = ? AND plan = 'free')`,
			)
			.bind(purchaseId, input.koudenId, kouden.owner_user_id, at, input.koudenId),
		db
			.prepare(
				`UPDATE koudens SET plan = 'paid', updated_at = ?
          WHERE id = ? AND plan = 'free' AND EXISTS (SELECT 1 FROM purchases WHERE id = ?)`,
			)
			.bind(at, input.koudenId, purchaseId),
		auditStatement(
			db,
			{
				adminEmail: input.adminEmail,
				action: "kouden.grant_paid",
				targetType: "kouden",
				targetId: input.koudenId,
				detail: { reason: input.reason, purchaseId },
			},
			at,
			{ sql: "EXISTS (SELECT 1 FROM purchases WHERE id = ?)", params: [purchaseId] },
		),
	]);
	return (upgraded?.meta.changes ?? 0) > 0 ? { ok: true } : { ok: false, reason: "already_paid" };
}

export type RevokeResult =
	| { ok: true; koudenId: string; downgraded: boolean }
	| { ok: false; reason: "not_found" | "already_refunded" };

/**
 * 購入を取り消す。有効な購入が残っていなければ香典帳を無料に戻す（記録は消さず、新規登録だけが止まる）。
 * Stripe の購入の返金は Stripe のダッシュボードで行う（返金の Webhook で自動的に取り消される）。
 * ここは返金を伴わない取り消し・手動の有料化の取り消しに使う
 */
export async function revokePurchase(
	db: D1Database,
	input: { purchaseId: string; reason: string; adminEmail: string },
	now: Date,
): Promise<RevokeResult> {
	const purchase = await db
		.prepare("SELECT kouden_id, status FROM purchases WHERE id = ?")
		.bind(input.purchaseId)
		.first<{ kouden_id: string; status: string }>();
	if (!purchase) return { ok: false, reason: "not_found" };
	const at = now.toISOString();
	const revokedNow = {
		sql: "EXISTS (SELECT 1 FROM purchases WHERE id = ? AND status = 'refunded' AND refunded_at = ?)",
		params: [input.purchaseId, at],
	};
	const [revoked, , downgraded] = await db.batch([
		db
			.prepare(
				"UPDATE purchases SET status = 'refunded', refunded_at = ? WHERE id = ? AND status = 'paid'",
			)
			.bind(at, input.purchaseId),
		// 監査ログは、直前の文でこの要求が取り消した場合だけ書く（同じ時刻の二度押しでも重ならない）
		auditStatement(
			db,
			{
				adminEmail: input.adminEmail,
				action: "purchase.revoke",
				targetType: "purchase",
				targetId: input.purchaseId,
				detail: { reason: input.reason, koudenId: purchase.kouden_id },
			},
			at,
			CHANGED_JUST_NOW,
		),
		db
			.prepare(
				`UPDATE koudens SET plan = 'free', updated_at = ?
          WHERE id = ? AND plan = 'paid'
            AND NOT EXISTS (SELECT 1 FROM purchases WHERE kouden_id = ? AND status = 'paid')
            AND ${revokedNow.sql}`,
			)
			.bind(at, purchase.kouden_id, purchase.kouden_id, ...revokedNow.params),
	]);
	if ((revoked?.meta.changes ?? 0) === 0) return { ok: false, reason: "already_refunded" };
	return {
		ok: true,
		koudenId: purchase.kouden_id,
		downgraded: (downgraded?.meta.changes ?? 0) > 0,
	};
}

// ---- 旧ユーザーの手動紐づけ（E10-2） ------------------------------------------------

export interface LegacyRow {
	legacyUserId: string;
	email: string;
	displayName: string | null;
	authProvider: "google" | "email";
	linkedUserId: string | null;
	linkedAt: string | null;
	linkedBy: string | null;
	/** 移行で作った users の行（旧アカウントの香典帳の参加はこの行に付いている） */
	userId: string | null;
	koudenCount: number;
}

export async function listLegacyUsers(
	db: D1Database,
	options: { q?: string; unlinkedOnly: boolean; legacyUserId?: string; limit?: number },
): Promise<LegacyRow[]> {
	const where: string[] = [];
	const params: unknown[] = [];
	if (options.legacyUserId) {
		where.push("l.legacy_user_id = ?");
		params.push(options.legacyUserId);
	}
	if (options.q) {
		where.push("(l.email LIKE ? ESCAPE '\\' OR l.display_name LIKE ? ESCAPE '\\')");
		params.push(likeOf(options.q), likeOf(options.q));
	}
	if (options.unlinkedOnly) where.push("l.linked_user_id IS NULL");
	const { results } = await db
		.prepare(
			`SELECT l.legacy_user_id, l.email, l.display_name, l.auth_provider, l.linked_user_id,
              l.linked_at, l.linked_by, u.id AS user_id,
              (SELECT count(*) FROM kouden_members m WHERE m.user_id = u.id) AS kouden_count
         FROM legacy_users l LEFT JOIN users u ON u.legacy_user_id = l.legacy_user_id
        ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY l.linked_user_id IS NOT NULL, l.email LIMIT ?`,
		)
		.bind(...params, options.limit ?? 100)
		.all<{
			legacy_user_id: string;
			email: string;
			display_name: string | null;
			auth_provider: "google" | "email";
			linked_user_id: string | null;
			linked_at: string | null;
			linked_by: string | null;
			user_id: string | null;
			kouden_count: number;
		}>();
	return results.map((r) => ({
		legacyUserId: r.legacy_user_id,
		email: r.email,
		displayName: r.display_name,
		authProvider: r.auth_provider,
		linkedUserId: r.linked_user_id,
		linkedAt: r.linked_at,
		linkedBy: r.linked_by,
		userId: r.user_id,
		koudenCount: r.kouden_count,
	}));
}

export async function legacyUser(db: D1Database, legacyUserId: string): Promise<LegacyRow | null> {
	const [row] = await listLegacyUsers(db, { unlinkedOnly: false, legacyUserId, limit: 1 });
	return row ?? null;
}

/** 紐づけ先の候補（新しく Google でログインしたアカウント。旧アカウントの行・削除済みは除く） */
export async function linkCandidates(db: D1Database, email: string): Promise<UserRow[]> {
	const { results } = await db
		.prepare(
			`SELECT u.id, u.email, u.display_name, u.created_at, u.deleted_at, u.legacy_user_id,
              u.google_sub IS NOT NULL AS google_linked,
              (SELECT count(*) FROM kouden_members m WHERE m.user_id = u.id) AS kouden_count
         FROM users u
        WHERE lower(u.email) = lower(?) AND u.deleted_at IS NULL
          AND u.legacy_user_id IS NULL AND u.google_sub IS NOT NULL
        ORDER BY u.created_at DESC LIMIT 10`,
		)
		.bind(email.trim())
		.all<Parameters<typeof toUserRow>[0]>();
	return results.map(toUserRow);
}

export type LinkResult =
	| { ok: true; userId: string }
	| {
			ok: false;
			reason:
				| "legacy_not_found"
				| "already_linked"
				| "legacy_user_missing"
				| "legacy_user_active"
				| "target_invalid";
	  };

/**
 * 旧ユーザー（移行で作った users の行 L）に、本人確認できた新しい Google アカウント（N）を紐づける。
 * N の Google の sub を L に移し、N の参加・所有・購入などを L に寄せてから N を削除済みにする
 * （本人は次のログインから L として扱われる。N で作っていた香典帳もそのまま使える）。
 * 1 つの batch で行い、2 文目以降は「この操作で紐づけた」ことを条件にする（同時に操作しても二重に寄せない）
 */
export async function linkLegacyUser(
	db: D1Database,
	input: { legacyUserId: string; targetUserId: string; adminEmail: string },
	now: Date,
): Promise<LinkResult> {
	const legacy = await db
		.prepare("SELECT linked_user_id FROM legacy_users WHERE legacy_user_id = ?")
		.bind(input.legacyUserId)
		.first<{ linked_user_id: string | null }>();
	if (!legacy) return { ok: false, reason: "legacy_not_found" };
	if (legacy.linked_user_id) return { ok: false, reason: "already_linked" };
	const l = await db
		.prepare("SELECT id, google_sub, deleted_at FROM users WHERE legacy_user_id = ?")
		.bind(input.legacyUserId)
		.first<{ id: string; google_sub: string | null; deleted_at: string | null }>();
	if (!l || l.deleted_at) return { ok: false, reason: "legacy_user_missing" };
	if (l.google_sub) return { ok: false, reason: "legacy_user_active" };
	const n = await db
		.prepare(
			`SELECT id, google_sub, email, avatar_url FROM users
        WHERE id = ? AND deleted_at IS NULL AND legacy_user_id IS NULL AND google_sub IS NOT NULL`,
		)
		.bind(input.targetUserId)
		.first<{ id: string; google_sub: string; email: string; avatar_url: string | null }>();
	if (!n || n.id === l.id) return { ok: false, reason: "target_invalid" };

	const at = now.toISOString();
	const L = l.id;
	const N = n.id;
	// この操作で紐づけたことの確認（以降の文の条件）
	const linked =
		"EXISTS (SELECT 1 FROM legacy_users WHERE legacy_user_id = ? AND linked_user_id = ? AND linked_at = ?)";
	const guard = [input.legacyUserId, L, at];
	const step = (sql: string, ...params: unknown[]) =>
		db.prepare(`${sql} AND ${linked}`).bind(...params, ...guard);

	const [first] = await db.batch([
		db
			.prepare(
				`UPDATE legacy_users SET linked_user_id = ?, linked_at = ?, linked_by = ?
          WHERE legacy_user_id = ? AND linked_user_id IS NULL`,
			)
			.bind(L, at, input.adminEmail, input.legacyUserId),
		// 監査ログは、直前の文でこの要求が紐づけた場合だけ書く
		auditStatement(
			db,
			{
				adminEmail: input.adminEmail,
				action: "legacy_user.link",
				targetType: "legacy_user",
				targetId: input.legacyUserId,
				detail: { userId: L, mergedUserId: N, email: n.email },
			},
			at,
			CHANGED_JUST_NOW,
		),
		// 両方が参加している香典帳: N がオーナーなら L をオーナーにする（オーナーは 1 冊に 1 人なので、先に N を外す）
		step(
			`UPDATE kouden_members SET role = 'editor'
        WHERE user_id = ? AND role = 'owner'
          AND kouden_id IN (SELECT kouden_id FROM kouden_members WHERE user_id = ?)`,
			N,
			L,
		),
		step(
			`UPDATE kouden_members SET role = 'owner'
        WHERE user_id = ? AND kouden_id IN (SELECT id FROM koudens WHERE owner_user_id = ?)`,
			L,
			N,
		),
		// 両方が参加している香典帳: N が編集者で L が閲覧者なら、L を編集者にする（強い方のロールを残す）
		step(
			`UPDATE kouden_members SET role = 'editor'
        WHERE user_id = ? AND role = 'viewer'
          AND kouden_id IN (SELECT kouden_id FROM kouden_members WHERE user_id = ? AND role = 'editor')`,
			L,
			N,
		),
		// N だけが参加している香典帳は、参加を L に移す
		step(
			`UPDATE kouden_members SET user_id = ?
        WHERE user_id = ? AND kouden_id NOT IN (SELECT kouden_id FROM kouden_members WHERE user_id = ?)`,
			L,
			N,
			L,
		),
		step("DELETE FROM kouden_members WHERE user_id = ?", N),
		step("UPDATE koudens SET owner_user_id = ? WHERE owner_user_id = ?", L, N),
		step(
			`UPDATE ownership_transfers SET status = 'cancelled', resolved_at = ?
        WHERE status = 'pending' AND (from_user_id = ? OR to_user_id = ?)`,
			at,
			N,
			N,
		),
		step("UPDATE invitations SET created_by = ? WHERE created_by = ?", L, N),
		step("UPDATE kouden_members SET invited_by = ? WHERE invited_by = ?", L, N),
		step("UPDATE purchases SET user_id = ? WHERE user_id = ?", L, N),
		// N のセッションは使えなくなる（次のログインで L になる）。L に残っているものもあれば消し、ログインし直させる
		step("DELETE FROM sessions WHERE user_id IN (?, ?)", N, L),
		// sub の一意制約に当たらないよう、先に N から外してから L に付ける
		step(
			`UPDATE users SET google_sub = NULL, deleted_at = ?, email = '', display_name = '（旧アカウントに統合）',
                        avatar_url = NULL, updated_at = ?
        WHERE id = ? AND google_sub = ?`,
			at,
			at,
			N,
			n.google_sub,
		),
		step(
			`UPDATE users SET google_sub = ?, email = ?, avatar_url = ?, updated_at = ?
        WHERE id = ? AND google_sub IS NULL`,
			n.google_sub,
			n.email,
			n.avatar_url,
			at,
			L,
		),
	]);
	if ((first?.meta.changes ?? 0) === 0) return { ok: false, reason: "already_linked" };
	return { ok: true, userId: L };
}
