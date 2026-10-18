import type { KoudenInput, Plan, Role } from "@kouden/domain";
import { uuidv7 } from "@kouden/domain";
import { deleteKoudenFiles } from "./files.ts";

/** 香典帳の目録（D1 koudens）と、閲覧者のメンバーシップ */
export interface KoudenContext {
	id: string;
	title: string;
	deceasedName: string;
	/** 旧台帳名から仮設定した故人名が、まだオーナーに確認されていない */
	needsDeceasedNameConfirmation: boolean;
	ownerUserId: string;
	plan: Plan;
	status: "active" | "archived";
	/** D1 上のロール。アーカイブ中でも変わらない（書き込み可否は caller.role で判定する） */
	memberRole: Role;
}

export interface KoudenListItem {
	id: string;
	title: string;
	deceasedName: string;
	plan: Plan;
	role: Role;
	giftCount: number;
	totalAmount: number;
	lastActivityAt: string;
}

export async function createKouden(
	db: D1Database,
	userId: string,
	input: KoudenInput,
	now: Date,
): Promise<string> {
	const id = uuidv7(now.getTime());
	const at = now.toISOString();
	await db.batch([
		db
			.prepare(
				// 削除したアカウントでは作らない（削除と同時に送られた要求が、削除の後に届いた場合）
				`INSERT INTO koudens (id, title, deceased_name, owner_user_id, created_at, updated_at)
         SELECT ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM users WHERE id = ? AND deleted_at IS NULL)`,
			)
			.bind(id, input.title, input.deceasedName, userId, at, at, userId),
		db
			.prepare(
				`INSERT INTO kouden_members (kouden_id, user_id, role, joined_at)
         SELECT ?, ?, 'owner', ? WHERE EXISTS (SELECT 1 FROM koudens WHERE id = ?)`,
			)
			.bind(id, userId, at, id),
	]);
	return id;
}

/** 自分が参加している香典帳（E2-3）。件数・合計は DO からの投影なので数秒遅れることがある */
export async function listMyKoudens(
	db: D1Database,
	userId: string,
	status: "active" | "archived",
): Promise<KoudenListItem[]> {
	const { results } = await db
		.prepare(
			`SELECT k.id, k.title, k.deceased_name, k.plan, m.role,
              coalesce(s.gift_count, 0) AS gift_count, coalesce(s.total_amount, 0) AS total_amount,
              coalesce(s.last_activity_at, k.updated_at) AS last_activity_at
         FROM kouden_members m
         JOIN koudens k ON k.id = m.kouden_id
         LEFT JOIN kouden_stats s ON s.kouden_id = k.id
        WHERE m.user_id = ? AND k.status = ?
        ORDER BY last_activity_at DESC`,
		)
		.bind(userId, status)
		.all<{
			id: string;
			title: string;
			deceased_name: string;
			plan: Plan;
			role: Role;
			gift_count: number;
			total_amount: number;
			last_activity_at: string;
		}>();
	return results.map((r) => ({
		id: r.id,
		title: r.title,
		deceasedName: r.deceased_name,
		plan: r.plan,
		role: r.role,
		giftCount: r.gift_count,
		totalAmount: r.total_amount,
		lastActivityAt: r.last_activity_at,
	}));
}

/** メンバーなら香典帳の情報を返す。非メンバー・削除中は null（画面では 404 にする） */
export async function loadKouden(
	db: D1Database,
	koudenId: string,
	userId: string,
): Promise<KoudenContext | null> {
	const row = await db
		.prepare(
			`SELECT k.id, k.title, k.deceased_name, k.legacy_kouden_id, k.deceased_name_confirmed_at,
              k.owner_user_id, k.plan, k.status, m.role
         FROM koudens k JOIN kouden_members m ON m.kouden_id = k.id AND m.user_id = ?
        WHERE k.id = ? AND k.status IN ('active', 'archived')`,
		)
		.bind(userId, koudenId)
		.first<{
			id: string;
			title: string;
			deceased_name: string;
			legacy_kouden_id: string | null;
			deceased_name_confirmed_at: string | null;
			owner_user_id: string;
			plan: Plan;
			status: "active" | "archived";
			role: Role;
		}>();
	if (!row) return null;
	return {
		id: row.id,
		title: row.title,
		deceasedName: row.deceased_name,
		needsDeceasedNameConfirmation:
			row.legacy_kouden_id !== null && row.deceased_name_confirmed_at === null,
		ownerUserId: row.owner_user_id,
		plan: row.plan,
		status: row.status,
		memberRole: row.role,
	};
}

/** 旧アプリの香典帳 ID から、閲覧者が開ける香典帳の ID を引く（旧 URL の転送用） */
export async function findKoudenIdByLegacyId(
	db: D1Database,
	legacyKoudenId: string,
	userId: string,
): Promise<string | null> {
	return db
		.prepare(
			`SELECT k.id
         FROM koudens k JOIN kouden_members m ON m.kouden_id = k.id AND m.user_id = ?
        WHERE k.legacy_kouden_id = ? AND k.status IN ('active', 'archived')`,
		)
		.bind(userId, legacyKoudenId)
		.first<string>("id");
}

export async function updateKoudenInfo(
	db: D1Database,
	koudenId: string,
	input: KoudenInput,
	now: Date,
): Promise<void> {
	await db
		.prepare("UPDATE koudens SET title = ?, deceased_name = ?, updated_at = ? WHERE id = ?")
		.bind(input.title, input.deceasedName, now.toISOString(), koudenId)
		.run();
}

/** 名前と確認日時を同時に保存する。再送や権限変更後の要求で、確認済みの名前を上書きしない */
export async function confirmDeceasedName(
	db: D1Database,
	koudenId: string,
	userId: string,
	input: KoudenInput,
	now: Date,
): Promise<boolean> {
	const at = now.toISOString();
	const result = await db
		.prepare(
			`UPDATE koudens SET title = ?, deceased_name = ?, deceased_name_confirmed_at = ?, updated_at = ?
        WHERE id = ? AND status = 'active' AND owner_user_id = ?
          AND legacy_kouden_id IS NOT NULL AND deceased_name_confirmed_at IS NULL
          AND EXISTS (SELECT 1 FROM kouden_members
                       WHERE kouden_id = koudens.id AND user_id = ? AND role = 'owner')`,
		)
		.bind(input.title, input.deceasedName, at, at, koudenId, userId, userId)
		.run();
	return result.meta.changes === 1;
}

export async function setKoudenStatus(
	db: D1Database,
	koudenId: string,
	status: "active" | "archived",
	now: Date,
): Promise<void> {
	await db
		.prepare(
			"UPDATE koudens SET status = ?, updated_at = ? WHERE id = ? AND status IN ('active', 'archived')",
		)
		.bind(status, now.toISOString(), koudenId)
		.run();
}

/**
 * 香典帳の削除（03 §8）。先に `deleting` にして画面から見えなくし、DO の中身を消してから D1 の行を消す。
 * 途中で失敗しても、日次 Cron が `deleting` のものを最後まで処理する。
 */
export async function deleteKouden(
	env: Env,
	koudenId: string,
	now: Date,
	deleteLedger: (koudenId: string) => Promise<void>,
): Promise<void> {
	await env.DB.prepare("UPDATE koudens SET status = 'deleting', updated_at = ? WHERE id = ?")
		.bind(now.toISOString(), koudenId)
		.run();
	await finishDeletion(env, koudenId, deleteLedger);
}

export async function finishDeletion(
	env: Env,
	koudenId: string,
	deleteLedger: (koudenId: string) => Promise<void>,
): Promise<void> {
	await deleteLedger(koudenId);
	await deleteKoudenFiles(env, koudenId);
	// kouden_members・kouden_stats は ON DELETE CASCADE で消える
	await env.DB.prepare("DELETE FROM koudens WHERE id = ? AND status = 'deleting'")
		.bind(koudenId)
		.run();
}

export async function listDeletingKoudens(db: D1Database): Promise<string[]> {
	const { results } = await db
		.prepare("SELECT id FROM koudens WHERE status = 'deleting' LIMIT 100")
		.all<{ id: string }>();
	return results.map((r) => r.id);
}
