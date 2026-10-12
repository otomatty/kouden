import { can } from "@kouden/domain";
import { Hono } from "hono";
import { renderSVG } from "uqr";
import {
	acceptInvitation,
	acceptTransfer,
	cancelTransfer,
	changeRole,
	createInvitation,
	createTransfer,
	declineTransfer,
	findInvitation,
	INVITE_EXPIRY_DAYS,
	isMember,
	listActiveInvitations,
	listMembers,
	pendingTransfer,
	removeMember,
	revokeInvitation,
} from "../kouden/members.ts";
import { setKoudenStatus } from "../kouden/store.ts";
import { ledgerFor } from "../ledger/client.ts";
import type { KoudenLedger } from "../ledger/ledger.ts";
import type { Caller } from "../ledger/types.ts";
import { log } from "../lib/logger.ts";
import { requireUser } from "../middleware/session.ts";
import type { AppEnv } from "../types.ts";
import { MembersPage, type NewInvite } from "../views/kouden/members.tsx";
import { Layout } from "../views/layout.tsx";
import { ErrorPage } from "../views/pages/error.tsx";
import { InvitePage } from "../views/pages/invite.tsx";
import { basePath, type Ctx, errorResponse, formValues, koudenPage, noticeOf } from "./helpers.tsx";

type ExternalChange = Parameters<KoudenLedger["recordExternalChange"]>[1];

/**
 * D1 の変更を DO に知らせる（変更ログへの記録・接続中の画面への通知・接続の失効）。
 * 権限の正は D1 にあるので、通知に失敗しても要求自体は成功とし、1 回だけ再試行する（04 §5）。
 */
export async function notifyLedger(
	env: Env,
	actor: Caller,
	change: ExternalChange,
	options: { revokeUserId?: string } = {},
): Promise<void> {
	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			await ledgerFor(env, actor.koudenId).recordExternalChange(actor, change, options);
			return;
		} catch (err) {
			log("warn", "ledger_notify_failed", {
				koudenId: actor.koudenId,
				attempt,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
}

async function renderMembers(
	c: Ctx,
	options: { newInvite?: NewInvite; error?: string; status?: 200 | 409 | 422 } = {},
) {
	const kouden = c.get("kouden");
	const now = c.get("now");
	const isOwner = can(kouden.memberRole, "members.manage");
	const [members, invitations, transfer] = await Promise.all([
		listMembers(c.env.DB, kouden.id),
		isOwner ? listActiveInvitations(c.env.DB, kouden.id, now) : Promise.resolve([]),
		pendingTransfer(c.env.DB, kouden.id, now),
	]);
	return koudenPage(
		c,
		"メンバー",
		"members",
		<MembersPage
			kouden={kouden}
			userId={c.get("caller").userId}
			members={members}
			invitations={invitations}
			transfer={transfer}
			newInvite={options.newInvite}
			notice={noticeOf(c)}
			error={options.error}
		/>,
		{ status: options.status },
	);
}

const ownerOnly = (c: Ctx) => !can(c.get("kouden").memberRole, "members.manage");

/** /k/:koudenId 配下のメンバー関連のルート */
export function registerMemberRoutes(k: Hono<AppEnv>): void {
	k.get("/members", (c) => renderMembers(c));

	// ---- 招待リンク ----
	k.post("/invitations", async (c) => {
		const kouden = c.get("kouden");
		if (ownerOnly(c) || kouden.status !== "active") return errorResponse(c, 403);
		const values = await formValues(c);
		const role = values.role === "viewer" ? "viewer" : "editor";
		const days = Number(values.expiresInDays);
		const expiresInDays = (INVITE_EXPIRY_DAYS as readonly number[]).includes(days) ? days : 7;
		const rawMax = values.maxUses?.normalize("NFKC").trim() ?? "";
		let maxUses: number | null = null;
		if (rawMax !== "") {
			maxUses = /^\d+$/.test(rawMax) ? Number(rawMax) : Number.NaN;
			if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000) {
				return renderMembers(c, {
					error: "使用回数の上限は 1〜1000 の数字で入力してください",
					status: 422,
				});
			}
		}
		const { token } = await createInvitation(c.env.DB, {
			koudenId: kouden.id,
			role,
			maxUses,
			expiresInDays,
			createdBy: c.get("caller").userId,
			now: c.get("now"),
		});
		const url = `${c.env.APP_ORIGIN}/invite/${token}`;
		const qr = `data:image/svg+xml;base64,${btoa(renderSVG(url, { border: 2 }))}`;
		// トークンは保存していないので、リダイレクトせずにこの応答でだけ表示する
		c.header("Cache-Control", "no-store");
		return renderMembers(c, { newInvite: { url, qr, role } });
	});

	k.post("/invitations/:invitationId/revoke", async (c) => {
		if (ownerOnly(c)) return errorResponse(c, 403);
		await revokeInvitation(c.env.DB, c.get("kouden").id, c.req.param("invitationId"), c.get("now"));
		return c.redirect(`${basePath(c)}/members?notice=revoked#invitations`, 303);
	});

	// ---- ロール変更・除外・退出（E3-3, E3-5） ----
	k.post("/members/:userId/role", async (c) => {
		if (ownerOnly(c)) return errorResponse(c, 403);
		const userId = c.req.param("userId");
		const role = (await formValues(c)).role === "viewer" ? "viewer" : "editor";
		if (await changeRole(c.env.DB, c.get("kouden").id, userId, role)) {
			await notifyLedger(c.env, c.get("caller"), {
				entity: "member",
				entityId: userId,
				op: "update",
				diff: { role: [null, role] },
			});
		}
		return c.redirect(`${basePath(c)}/members?notice=role`, 303);
	});

	k.post("/members/:userId/remove", async (c) => {
		if (ownerOnly(c)) return errorResponse(c, 403);
		const userId = c.req.param("userId");
		if (await removeMember(c.env.DB, c.get("kouden").id, userId, c.get("now"))) {
			await notifyLedger(
				c.env,
				c.get("caller"),
				{ entity: "member", entityId: userId, op: "delete", diff: null },
				{ revokeUserId: userId },
			);
		}
		return c.redirect(`${basePath(c)}/members?notice=removed`, 303);
	});

	k.post("/leave", async (c) => {
		const kouden = c.get("kouden");
		const caller = c.get("caller");
		if (kouden.memberRole === "owner") {
			return renderMembers(c, {
				error: "オーナーは抜けられません。先に別のメンバーへオーナーを譲ってください",
				status: 422,
			});
		}
		if (await removeMember(c.env.DB, kouden.id, caller.userId, c.get("now"))) {
			await notifyLedger(
				c.env,
				caller,
				{ entity: "member", entityId: caller.userId, op: "delete", diff: null },
				{ revokeUserId: caller.userId },
			);
		}
		return c.redirect("/?notice=left", 303);
	});

	// ---- オーナー譲渡（E3-4） ----
	k.post("/transfer", async (c) => {
		if (ownerOnly(c)) return errorResponse(c, 403);
		const toUserId = (await formValues(c)).toUserId ?? "";
		const result = await createTransfer(
			c.env.DB,
			c.get("kouden").id,
			c.get("caller").userId,
			toUserId,
			c.get("now"),
		);
		if (result === "already_pending") {
			return renderMembers(c, {
				error: "保留中の譲渡があります。取り消してから申し出てください",
				status: 409,
			});
		}
		if (result === "not_member") {
			return renderMembers(c, {
				error: "譲渡先はこの香典帳のメンバーから選んでください",
				status: 422,
			});
		}
		return c.redirect(`${basePath(c)}/members?notice=transfer`, 303);
	});

	k.post("/transfer/cancel", async (c) => {
		if (ownerOnly(c)) return errorResponse(c, 403);
		await cancelTransfer(c.env.DB, c.get("kouden").id, c.get("now"));
		return c.redirect(`${basePath(c)}/members?notice=transfer_cancelled`, 303);
	});

	k.post("/transfer/accept", async (c) => {
		const caller = c.get("caller");
		const transferId = (await formValues(c)).transferId ?? "";
		const transfer = await acceptTransfer(c.env.DB, transferId, caller.userId, c.get("now"));
		if (!transfer) {
			return renderMembers(c, {
				error: "この譲渡は承諾できません（期限切れ・取り消し済みなど）",
				status: 409,
			});
		}
		await notifyLedger(c.env, caller, {
			entity: "member",
			entityId: transfer.fromUserId,
			op: "update",
			diff: { role: ["owner", "editor"] },
		});
		await notifyLedger(c.env, caller, {
			entity: "member",
			entityId: transfer.toUserId,
			op: "update",
			diff: { role: [null, "owner"] },
		});
		return c.redirect(`${basePath(c)}/members?notice=owner`, 303);
	});

	k.post("/transfer/decline", async (c) => {
		const transferId = (await formValues(c)).transferId ?? "";
		await declineTransfer(c.env.DB, transferId, c.get("caller").userId, c.get("now"));
		return c.redirect(`${basePath(c)}/members?notice=transfer_declined`, 303);
	});
}

/** アーカイブ・解除を接続中の全員に知らせる（全員のロールの実効値が変わるため） */
export async function setStatusAndNotify(c: Ctx, archived: boolean): Promise<void> {
	const kouden = c.get("kouden");
	const status = archived ? "archived" : "active";
	await setKoudenStatus(c.env.DB, kouden.id, status, c.get("now"));
	await notifyLedger(c.env, c.get("caller"), {
		entity: "kouden",
		entityId: kouden.id,
		op: "update",
		diff: { status: [kouden.status, status] },
	});
}

// ---- 招待の受諾（/invite/:token） ---------------------------------------------

export const inviteRoutes = new Hono<AppEnv>();

inviteRoutes.get("/invite/:token", async (c) => {
	const token = c.req.param("token");
	const user = c.get("user");
	const invitation = await findInvitation(c.env.DB, token, c.get("now"));
	// すでにメンバーなら、そのまま香典帳へ
	if (user && invitation && (await isMember(c.env.DB, invitation.koudenId, user.id))) {
		return c.redirect(`/k/${invitation.koudenId}`);
	}
	c.header("Referrer-Policy", "no-referrer");
	return c.html(
		<Layout title="香典帳への招待" user={user}>
			<InvitePage invitation={invitation} token={token} loggedIn={user !== null} />
		</Layout>,
		invitation ? 200 : 404,
	);
});

inviteRoutes.post("/invite/:token", requireUser, async (c) => {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	const ip = c.req.header("cf-connecting-ip") ?? "unknown";
	const { success } = await c.env.INVITE_RATE_LIMITER.limit({ key: `invite:${ip}` });
	if (!success) {
		return c.html(
			<Layout title="操作が多すぎます" user={user}>
				<ErrorPage status={429} />
			</Layout>,
			429,
		);
	}
	const token = c.req.param("token");
	const now = c.get("now");
	const invitation = await findInvitation(c.env.DB, token, now);
	if (invitation && (await isMember(c.env.DB, invitation.koudenId, user.id))) {
		return c.redirect(`/k/${invitation.koudenId}`, 303);
	}
	if (
		!invitation ||
		invitation.state !== "valid" ||
		!(await acceptInvitation(c.env.DB, invitation.id, user.id, now))
	) {
		// 状態を読み直して理由を表示する（同時に受けて上限に達した場合など）
		const latest = await findInvitation(c.env.DB, token, now);
		return c.html(
			<Layout title="香典帳への招待" user={user}>
				<InvitePage
					invitation={latest && latest.state === "valid" ? { ...latest, state: "used_up" } : latest}
					token={token}
					loggedIn
				/>
			</Layout>,
			409,
		);
	}
	await notifyLedger(
		c.env,
		{
			koudenId: invitation.koudenId,
			userId: user.id,
			displayName: user.displayName,
			role: invitation.role,
			plan: "free",
		},
		{ entity: "member", entityId: user.id, op: "create", diff: { role: [null, invitation.role] } },
	);
	// 編集者は受付画面へ（E3-2: リンク → ログイン → 受付）
	return c.redirect(
		`/k/${invitation.koudenId}${invitation.role === "editor" ? "/reception" : ""}`,
		303,
	);
});
