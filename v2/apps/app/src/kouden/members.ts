import type { Role } from "@kouden/domain";
import { uuidv7 } from "@kouden/domain";
import { randomToken, sha256Hex } from "../lib/crypto.ts";

/**
 * メンバー・招待リンク・オーナー譲渡（E3。D1 が正）。
 * 複数の行を変える処理は db.batch() で 1 トランザクションにし、条件付きの UPDATE / INSERT で整合を保つ。
 */

export const TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITE_EXPIRY_DAYS = [1, 3, 7, 30] as const;
export type InviteRole = "editor" | "viewer";

export interface Member {
	userId: string;
	displayName: string;
	email: string;
	role: Role;
	joinedAt: string;
}

export async function listMembers(db: D1Database, koudenId: string): Promise<Member[]> {
	const { results } = await db
		.prepare(
			`SELECT m.user_id, u.display_name, u.email, m.role, m.joined_at
         FROM kouden_members m JOIN users u ON u.id = m.user_id
        WHERE m.kouden_id = ?
        ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, m.joined_at`,
		)
		.bind(koudenId)
		.all<{ user_id: string; display_name: string; email: string; role: Role; joined_at: string }>();
	return results.map((r) => ({
		userId: r.user_id,
		displayName: r.display_name,
		email: r.email,
		role: r.role,
		joinedAt: r.joined_at,
	}));
}

/** ロールの変更（オーナーの行は変えない）。変更できたら true */
export async function changeRole(
	db: D1Database,
	koudenId: string,
	userId: string,
	role: InviteRole,
): Promise<boolean> {
	const res = await db
		.prepare(
			"UPDATE kouden_members SET role = ? WHERE kouden_id = ? AND user_id = ? AND role <> 'owner'",
		)
		.bind(role, koudenId, userId)
		.run();
	return res.meta.changes === 1;
}

/** メンバーの除外・本人の退出（オーナーは抜けられない）。保留中の譲渡先なら譲渡も取り消す */
export async function removeMember(
	db: D1Database,
	koudenId: string,
	userId: string,
	now: Date,
): Promise<boolean> {
	const [, removed] = await db.batch([
		db
			.prepare(
				`UPDATE ownership_transfers SET status = 'cancelled', resolved_at = ?
          WHERE kouden_id = ? AND to_user_id = ? AND status = 'pending'`,
			)
			.bind(now.toISOString(), koudenId, userId),
		db
			.prepare("DELETE FROM kouden_members WHERE kouden_id = ? AND user_id = ? AND role <> 'owner'")
			.bind(koudenId, userId),
	]);
	return removed?.meta.changes === 1;
}

// ---- 招待リンク（E3-1, E3-2） -------------------------------------------------

export interface Invitation {
	id: string;
	role: InviteRole;
	maxUses: number | null;
	usedCount: number;
	expiresAt: string;
	createdAt: string;
}

export async function createInvitation(
	db: D1Database,
	input: {
		koudenId: string;
		role: InviteRole;
		maxUses: number | null;
		expiresInDays: number;
		createdBy: string;
		now: Date;
	},
): Promise<{ id: string; token: string }> {
	const id = uuidv7(input.now.getTime());
	const token = randomToken();
	await db
		.prepare(
			`INSERT INTO invitations (id, kouden_id, token_hash, role, max_uses, expires_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			input.koudenId,
			await sha256Hex(token),
			input.role,
			input.maxUses,
			new Date(input.now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
			input.createdBy,
			input.now.toISOString(),
		)
		.run();
	return { id, token };
}

/** 使える招待リンク（無効化・期限切れ・上限到達を除く） */
export async function listActiveInvitations(
	db: D1Database,
	koudenId: string,
	now: Date,
): Promise<Invitation[]> {
	const { results } = await db
		.prepare(
			`SELECT id, role, max_uses, used_count, expires_at, created_at FROM invitations
        WHERE kouden_id = ? AND revoked_at IS NULL AND expires_at > ?
          AND (max_uses IS NULL OR used_count < max_uses)
        ORDER BY created_at DESC`,
		)
		.bind(koudenId, now.toISOString())
		.all<{
			id: string;
			role: InviteRole;
			max_uses: number | null;
			used_count: number;
			expires_at: string;
			created_at: string;
		}>();
	return results.map((r) => ({
		id: r.id,
		role: r.role,
		maxUses: r.max_uses,
		usedCount: r.used_count,
		expiresAt: r.expires_at,
		createdAt: r.created_at,
	}));
}

export async function revokeInvitation(
	db: D1Database,
	koudenId: string,
	invitationId: string,
	now: Date,
): Promise<void> {
	await db
		.prepare(
			"UPDATE invitations SET revoked_at = ? WHERE id = ? AND kouden_id = ? AND revoked_at IS NULL",
		)
		.bind(now.toISOString(), invitationId, koudenId)
		.run();
}

export type InvitationState = "valid" | "revoked" | "expired" | "used_up" | "unavailable";

export interface InvitationView {
	id: string;
	koudenId: string;
	koudenTitle: string;
	inviterName: string;
	role: InviteRole;
	state: InvitationState;
}

/** 招待トークンから招待を読む。見つからなければ null */
export async function findInvitation(
	db: D1Database,
	token: string,
	now: Date,
): Promise<InvitationView | null> {
	const row = await db
		.prepare(
			`SELECT i.id, i.kouden_id, i.role, i.max_uses, i.used_count, i.expires_at, i.revoked_at,
              k.title, k.status, u.display_name AS inviter_name
         FROM invitations i
         JOIN koudens k ON k.id = i.kouden_id
         JOIN users u ON u.id = i.created_by
        WHERE i.token_hash = ?`,
		)
		.bind(await sha256Hex(token))
		.first<{
			id: string;
			kouden_id: string;
			role: InviteRole;
			max_uses: number | null;
			used_count: number;
			expires_at: string;
			revoked_at: string | null;
			title: string;
			status: string;
			inviter_name: string;
		}>();
	if (!row) return null;
	let state: InvitationState = "valid";
	if (row.status !== "active") state = "unavailable";
	else if (row.revoked_at) state = "revoked";
	else if (row.expires_at <= now.toISOString()) state = "expired";
	else if (row.max_uses !== null && row.used_count >= row.max_uses) state = "used_up";
	return {
		id: row.id,
		koudenId: row.kouden_id,
		koudenTitle: row.title,
		inviterName: row.inviter_name,
		role: row.role,
		state,
	};
}

export async function isMember(db: D1Database, koudenId: string, userId: string): Promise<boolean> {
	const row = await db
		.prepare("SELECT 1 AS ok FROM kouden_members WHERE kouden_id = ? AND user_id = ?")
		.bind(koudenId, userId)
		.first();
	return row !== null;
}

/**
 * 招待を受けて参加する。条件（有効期限・無効化・使用回数）の確認・参加・使用回数の加算を
 * 1 つの batch で行うので、同時に受けても使用回数の上限を超えない。
 */
export async function acceptInvitation(
	db: D1Database,
	invitationId: string,
	userId: string,
	now: Date,
): Promise<boolean> {
	const at = now.toISOString();
	const [joined] = await db.batch([
		db
			.prepare(
				`INSERT INTO kouden_members (kouden_id, user_id, role, joined_at, invited_by)
         SELECT i.kouden_id, ?, i.role, ?, i.created_by
           FROM invitations i JOIN koudens k ON k.id = i.kouden_id
          WHERE i.id = ? AND i.revoked_at IS NULL AND i.expires_at > ?
            AND (i.max_uses IS NULL OR i.used_count < i.max_uses) AND k.status = 'active'
         ON CONFLICT DO NOTHING`,
			)
			.bind(userId, at, invitationId, at),
		db
			.prepare(
				`UPDATE invitations SET used_count = used_count + 1
          WHERE id = ? AND EXISTS (
            SELECT 1 FROM kouden_members m
             WHERE m.kouden_id = invitations.kouden_id AND m.user_id = ? AND m.joined_at = ?)`,
			)
			.bind(invitationId, userId, at),
	]);
	return joined?.meta.changes === 1;
}

// ---- オーナー譲渡（E3-4） ------------------------------------------------------

export interface Transfer {
	id: string;
	koudenId: string;
	koudenTitle: string;
	fromUserId: string;
	fromName: string;
	toUserId: string;
	toName: string;
	expiresAt: string;
}

const TRANSFER_SELECT = `SELECT t.id, t.kouden_id, k.title, t.from_user_id, f.display_name AS from_name,
       t.to_user_id, d.display_name AS to_name, t.expires_at
  FROM ownership_transfers t
  JOIN koudens k ON k.id = t.kouden_id
  JOIN users f ON f.id = t.from_user_id
  JOIN users d ON d.id = t.to_user_id`;

type TransferRow = {
	id: string;
	kouden_id: string;
	title: string;
	from_user_id: string;
	from_name: string;
	to_user_id: string;
	to_name: string;
	expires_at: string;
};

function toTransfer(r: TransferRow): Transfer {
	return {
		id: r.id,
		koudenId: r.kouden_id,
		koudenTitle: r.title,
		fromUserId: r.from_user_id,
		fromName: r.from_name,
		toUserId: r.to_user_id,
		toName: r.to_name,
		expiresAt: r.expires_at,
	};
}

/** 保留中（期限内）の譲渡 */
export async function pendingTransfer(
	db: D1Database,
	koudenId: string,
	now: Date,
): Promise<Transfer | null> {
	const row = await db
		.prepare(
			`${TRANSFER_SELECT} WHERE t.kouden_id = ? AND t.status = 'pending' AND t.expires_at > ?`,
		)
		.bind(koudenId, now.toISOString())
		.first<TransferRow>();
	return row ? toTransfer(row) : null;
}

/** 自分宛ての保留中の譲渡（一覧画面のお知らせ用） */
export async function incomingTransfers(
	db: D1Database,
	userId: string,
	now: Date,
): Promise<Transfer[]> {
	const { results } = await db
		.prepare(
			`${TRANSFER_SELECT} WHERE t.to_user_id = ? AND t.status = 'pending' AND t.expires_at > ?
        AND k.status IN ('active', 'archived')`,
		)
		.bind(userId, now.toISOString())
		.all<TransferRow>();
	return results.map(toTransfer);
}

export type CreateTransferResult = "created" | "not_member" | "already_pending";

/** 譲渡を申し出る。相手はオーナー以外の既存メンバーに限る */
export async function createTransfer(
	db: D1Database,
	koudenId: string,
	fromUserId: string,
	toUserId: string,
	now: Date,
): Promise<CreateTransferResult> {
	const at = now.toISOString();
	try {
		const [, inserted] = await db.batch([
			// 期限切れのまま残っている保留を片付ける（1 冊に保留は 1 件の制約のため）
			db
				.prepare(
					`UPDATE ownership_transfers SET status = 'expired', resolved_at = ?
            WHERE kouden_id = ? AND status = 'pending' AND expires_at <= ?`,
				)
				.bind(at, koudenId, at),
			db
				.prepare(
					`INSERT INTO ownership_transfers (id, kouden_id, from_user_id, to_user_id, status, created_at, expires_at)
           SELECT ?, ?, ?, ?, 'pending', ?, ?
            WHERE EXISTS (SELECT 1 FROM kouden_members WHERE kouden_id = ? AND user_id = ? AND role <> 'owner')
              AND EXISTS (SELECT 1 FROM koudens WHERE id = ? AND owner_user_id = ?)`,
				)
				.bind(
					uuidv7(now.getTime()),
					koudenId,
					fromUserId,
					toUserId,
					at,
					new Date(now.getTime() + TRANSFER_TTL_MS).toISOString(),
					koudenId,
					toUserId,
					koudenId,
					fromUserId,
				),
		]);
		return inserted?.meta.changes === 1 ? "created" : "not_member";
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) return "already_pending";
		throw err;
	}
}

export async function cancelTransfer(db: D1Database, koudenId: string, now: Date): Promise<void> {
	await db
		.prepare(
			`UPDATE ownership_transfers SET status = 'cancelled', resolved_at = ?
        WHERE kouden_id = ? AND status = 'pending'`,
		)
		.bind(now.toISOString(), koudenId)
		.run();
}

export async function declineTransfer(
	db: D1Database,
	transferId: string,
	userId: string,
	now: Date,
): Promise<boolean> {
	const res = await db
		.prepare(
			`UPDATE ownership_transfers SET status = 'declined', resolved_at = ?
        WHERE id = ? AND to_user_id = ? AND status = 'pending'`,
		)
		.bind(now.toISOString(), transferId, userId)
		.run();
	return res.meta.changes === 1;
}

/**
 * 譲渡を承諾する（03 §6）。譲渡の確定・旧オーナーを編集者に・新オーナーをオーナーに・
 * koudens.owner_user_id の更新を 1 つの batch で行う。後続の文は「この承諾で確定した」ことを条件にする。
 */
export async function acceptTransfer(
	db: D1Database,
	transferId: string,
	userId: string,
	now: Date,
): Promise<Transfer | null> {
	const row = await db
		.prepare(`${TRANSFER_SELECT} WHERE t.id = ? AND t.to_user_id = ?`)
		.bind(transferId, userId)
		.first<TransferRow>();
	if (!row) return null;
	const at = now.toISOString();
	const accepted = `EXISTS (SELECT 1 FROM ownership_transfers WHERE id = ? AND status = 'accepted' AND resolved_at = ?)`;
	const [result] = await db.batch([
		db
			.prepare(
				`UPDATE ownership_transfers SET status = 'accepted', resolved_at = ?
          WHERE id = ? AND to_user_id = ? AND status = 'pending' AND expires_at > ?
            AND EXISTS (SELECT 1 FROM koudens k WHERE k.id = ownership_transfers.kouden_id
                          AND k.owner_user_id = ownership_transfers.from_user_id
                          AND k.status IN ('active', 'archived'))
            AND EXISTS (SELECT 1 FROM kouden_members m WHERE m.kouden_id = ownership_transfers.kouden_id
                          AND m.user_id = ownership_transfers.to_user_id)`,
			)
			.bind(at, transferId, userId, at),
		db
			.prepare(
				`UPDATE kouden_members SET role = 'editor' WHERE kouden_id = ? AND user_id = ? AND ${accepted}`,
			)
			.bind(row.kouden_id, row.from_user_id, transferId, at),
		db
			.prepare(
				`UPDATE kouden_members SET role = 'owner' WHERE kouden_id = ? AND user_id = ? AND ${accepted}`,
			)
			.bind(row.kouden_id, row.to_user_id, transferId, at),
		db
			.prepare(`UPDATE koudens SET owner_user_id = ?, updated_at = ? WHERE id = ? AND ${accepted}`)
			.bind(row.to_user_id, at, row.kouden_id, transferId, at),
	]);
	return result?.meta.changes === 1 ? toTransfer(row) : null;
}

// ---- 日次の掃除 ----------------------------------------------------------------

export async function cleanupMembership(
	db: D1Database,
	now: Date,
): Promise<{ expiredTransfers: number; deletedInvitations: number }> {
	const at = now.toISOString();
	const [transfers, invitations] = await db.batch([
		db
			.prepare(
				`UPDATE ownership_transfers SET status = 'expired', resolved_at = ?
          WHERE status = 'pending' AND expires_at <= ?`,
			)
			.bind(at, at),
		// 期限切れ・無効化から 30 日たった招待を消す（画面にはもう出ない）
		db
			.prepare("DELETE FROM invitations WHERE coalesce(revoked_at, expires_at) <= ?")
			.bind(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
	]);
	return {
		expiredTransfers: transfers?.meta.changes ?? 0,
		deletedInvitations: invitations?.meta.changes ?? 0,
	};
}
