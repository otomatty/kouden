import {
	expectedImportUser,
	importDifferences,
	type ImportKoudenPayload,
	type ImportUser,
} from "@kouden/domain";

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
	payload: Pick<ImportKoudenPayload, "kouden" | "members" | "purchases">,
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
           deceased_name_confirmed_at = NULL,
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
				// 旧アプリの更新時刻のまま（取り込んだ時刻にしない）
				k.updatedAt,
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

type Row = Record<string, unknown>;

/** 取り込み前の D1 の行（台帳の取り込みに失敗したら restoreKoudenRows で戻す） */
export interface KoudenRowsBefore {
	kouden: Row | null;
	members: Row[];
	purchases: Row[];
}

export async function koudenRowsBefore(
	db: D1Database,
	koudenId: string,
): Promise<KoudenRowsBefore> {
	const [kouden, members, purchases] = await db.batch<Row>([
		db.prepare("SELECT * FROM koudens WHERE id = ?").bind(koudenId),
		db.prepare("SELECT * FROM kouden_members WHERE kouden_id = ?").bind(koudenId),
		db.prepare("SELECT * FROM purchases WHERE kouden_id = ?").bind(koudenId),
	]);
	return {
		kouden: kouden?.results[0] ?? null,
		members: members?.results ?? [],
		purchases: purchases?.results ?? [],
	};
}

/**
 * 台帳の取り込みに失敗したとき、D1 の香典帳・メンバー・購入を取り込み前に戻す（失敗した取り込みで、
 * 名前やメンバーだけが変わって前の台帳が見えるようにしない）。初めての取り込みなら香典帳の行ごと消す
 */
export async function restoreKoudenRows(
	db: D1Database,
	koudenId: string,
	before: KoudenRowsBefore,
): Promise<void> {
	const removeImported = [
		db.prepare("DELETE FROM purchases WHERE kouden_id = ?").bind(koudenId),
		db.prepare("DELETE FROM kouden_members WHERE kouden_id = ?").bind(koudenId),
	];
	if (before.kouden === null) {
		// メンバーと統計は ON DELETE CASCADE で消える
		await db.batch([
			...removeImported,
			db.prepare("DELETE FROM koudens WHERE id = ?").bind(koudenId),
		]);
		return;
	}
	// 香典帳の行は消さずに書き戻す（消すと統計・招待まで ON DELETE CASCADE で消える）
	const columns = Object.keys(before.kouden).filter((c) => c !== "id");
	const kouden = before.kouden;
	await db.batch([
		...removeImported,
		db
			.prepare(`UPDATE koudens SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`)
			.bind(...columns.map((c) => kouden[c]), koudenId),
		...before.members.map((m) => insertRow(db, "kouden_members", m)),
		...before.purchases.map((p) => insertRow(db, "purchases", p)),
	]);
}

/** 読み出した行をそのまま書き戻す（列名は SELECT * で読んだものだけ） */
function insertRow(db: D1Database, table: string, row: Row) {
	const columns = Object.keys(row);
	return db
		.prepare(
			`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
		)
		.bind(...columns.map((c) => row[c]));
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
	const rows = await db.batch([
		db
			.prepare(`SELECT legacy_kouden_id AS legacyKoudenId, title, deceased_name AS deceasedName,
      owner_user_id AS ownerUserId, status, created_at AS createdAt, updated_at AS updatedAt
      FROM koudens WHERE id = ?`)
			.bind(koudenId),
		db
			.prepare(`SELECT user_id AS userId, role, joined_at AS joinedAt, invited_by AS invitedBy
      FROM kouden_members WHERE kouden_id = ? ORDER BY user_id`)
			.bind(koudenId),
		db
			.prepare(`SELECT id, user_id AS userId, amount, stripe_checkout_session_id AS stripeCheckoutSessionId,
      created_at AS createdAt, source, status FROM purchases WHERE kouden_id = ? ORDER BY id`)
			.bind(koudenId),
	]);
	return {
		ownerUserId: kouden.owner_user_id,
		plan: kouden.plan,
		status: kouden.status,
		legacyKoudenId: kouden.legacy_kouden_id,
		members: { owner: roles.owner ?? 0, editor: roles.editor ?? 0, viewer: roles.viewer ?? 0 },
		paidPurchases: purchases?.results[0]?.n ?? 0,
		kouden: rows[0]?.results[0] ?? null,
		memberRows: rows[1]?.results ?? [],
		purchaseRows: rows[2]?.results ?? [],
	};
}

/** 全移行ユーザーをバッチ単位で読み戻す。メールアドレスなどの値は返さない。 */
export async function verifyImportedUsers(db: D1Database, users: ImportUser[]) {
	if (users.length === 0) return { checked: 0, differences: [] as string[] };
	const rows = await db.batch(
		users.flatMap((u) => [
			db
				.prepare(`SELECT id, legacy_user_id AS legacyUserId, email, display_name AS displayName,
      google_sub AS googleSub, created_at AS createdAt FROM users WHERE id = ?`)
				.bind(u.id),
			db
				.prepare(`SELECT legacy_user_id AS legacyUserId, email, display_name AS displayName,
      auth_provider AS authProvider FROM legacy_users WHERE legacy_user_id = ?`)
				.bind(u.legacyUserId),
		]),
	);
	return {
		checked: users.length,
		differences: users.flatMap((u, i) =>
			importDifferences(
				expectedImportUser(u),
				{
					user: rows[i * 2]?.results[0] ?? null,
					legacy: rows[i * 2 + 1]?.results[0] ?? null,
				},
				`users[${i}]`,
			),
		),
	};
}

/** 新規の一般ユーザーは含めず、旧データからの取り込み件数を照合する。 */
export async function importTotals(db: D1Database) {
	const row = await db
		.prepare(`SELECT
    (SELECT count(*) FROM users WHERE legacy_user_id IS NOT NULL) AS users,
    (SELECT count(*) FROM legacy_users) AS legacyUsers,
    (SELECT count(*) FROM koudens WHERE legacy_kouden_id IS NOT NULL) AS koudens`)
		.first();
	return row;
}
