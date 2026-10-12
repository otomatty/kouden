import { ROLES } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { Invitation, Member, Transfer } from "../../kouden/members.ts";
import { INVITE_EXPIRY_DAYS } from "../../kouden/members.ts";
import type { KoudenContext } from "../../kouden/store.ts";
import { Hidden } from "../components/form.tsx";
import { formatDateTime } from "../format.ts";
import { ui } from "../ui.ts";
import { LiveRegion } from "./shell.tsx";

/** 作成直後だけ表示する招待リンク（トークンは保存していないので、後から表示できない） */
export interface NewInvite {
	url: string;
	/** QR コード（SVG の data URL） */
	qr: string;
	role: "editor" | "viewer";
}

const INVITE_ROLE_HELP = {
	editor: "受付・記録の入力や編集ができます",
	viewer: "閲覧のみできます",
} as const;

/** メンバー・招待・オーナー譲渡（E3） */
export const MembersPage: FC<{
	kouden: KoudenContext;
	userId: string;
	members: Member[];
	invitations: Invitation[];
	transfer: Transfer | null;
	newInvite?: NewInvite | undefined;
	notice?: string | undefined;
	error?: string | undefined;
}> = ({ kouden, userId, members, invitations, transfer, newInvite, notice, error }) => {
	const base = `/k/${kouden.id}`;
	const isOwner = kouden.memberRole === "owner";
	// アーカイブ中は閲覧のみ（E2-4）。ロール変更・除外・譲渡の申し出はできない
	const canManage = isOwner && kouden.status === "active";
	return (
		<div class="mx-auto max-w-3xl space-y-8">
			{error && (
				<p role="alert" class={ui.alert}>
					{error}
				</p>
			)}
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}

			{transfer && transfer.toUserId === userId && (
				<section
					class="space-y-3 rounded-xl border-2 border-accent bg-surface p-6"
					aria-labelledby="transfer-request"
				>
					<h2 id="transfer-request" class={ui.h2}>
						オーナーの譲渡の依頼
					</h2>
					<p>
						{transfer.fromName}{" "}
						さんから、この香典帳のオーナーを引き継ぐよう依頼されています。承諾すると
						あなたがオーナーになり、{transfer.fromName} さんは編集者になります。
					</p>
					<p class="text-sm text-muted">期限: {formatDateTime(transfer.expiresAt)}</p>
					<div class="flex flex-wrap gap-2">
						<form method="post" action={`${base}/transfer/accept`}>
							<Hidden name="transferId" value={transfer.id} />
							<button type="submit" class={ui.buttonPrimary}>
								承諾してオーナーになる
							</button>
						</form>
						<form method="post" action={`${base}/transfer/decline`}>
							<Hidden name="transferId" value={transfer.id} />
							<button type="submit" class={ui.buttonSecondary}>
								辞退する
							</button>
						</form>
					</div>
				</section>
			)}

			{newInvite && (
				<section
					class="space-y-4 rounded-xl border-2 border-accent bg-surface p-6"
					aria-labelledby="new-invite"
				>
					<h2 id="new-invite" class={ui.h2}>
						招待リンク（{ROLES[newInvite.role]}）
					</h2>
					<p class="text-sm">
						LINE やメールで送るか、QR コードを読み取ってもらってください。
						<strong>このリンクはこの画面でしか表示できません。</strong>
						閉じた後に必要になったら、新しく作成してください。
					</p>
					<div class="flex flex-wrap items-center gap-2">
						<label for="invite-url" class="sr-only">
							招待リンク
						</label>
						<input
							id="invite-url"
							readonly
							value={newInvite.url}
							class={`${ui.input} min-w-0 flex-1 font-mono text-sm`}
						/>
						<button type="button" class={ui.buttonSecondary} data-copy="#invite-url">
							コピー
						</button>
					</div>
					<img
						src={newInvite.qr}
						alt="招待リンクの QR コード"
						width="200"
						height="200"
						class="rounded-lg border border-line"
					/>
				</section>
			)}

			<LiveRegion id="members" entities={["member"]}>
				<section class={`${ui.card} space-y-4`} aria-labelledby="member-list">
					<h2 id="member-list" class={ui.h2}>
						メンバー（{members.length} 人）
					</h2>
					{isOwner && !canManage && (
						<p class="text-sm text-muted">アーカイブ中はメンバーを変更できません。</p>
					)}
					<ul class="divide-y divide-line">
						{members.map((m) => (
							<li class="flex flex-wrap items-center gap-3 py-3">
								<div class="min-w-40 flex-1">
									<span class="font-medium">{m.displayName}</span>
									{m.userId === userId && <span class="ml-1 text-sm text-muted">（あなた）</span>}
									<span class={`${ui.badge} ml-2`}>{ROLES[m.role]}</span>
									{isOwner && <div class="text-xs break-all text-muted">{m.email}</div>}
								</div>
								{canManage && m.role !== "owner" && (
									<>
										<form
											method="post"
											action={`${base}/members/${m.userId}/role`}
											class="flex items-center gap-1"
										>
											<label for={`role-${m.userId}`} class="sr-only">
												{m.displayName} さんのロール
											</label>
											<select
												id={`role-${m.userId}`}
												name="role"
												class={`${ui.input} w-auto py-1 text-sm`}
											>
												<option value="editor" selected={m.role === "editor"}>
													編集者
												</option>
												<option value="viewer" selected={m.role === "viewer"}>
													閲覧者
												</option>
											</select>
											<button type="submit" class={ui.buttonSmall}>
												変更
											</button>
										</form>
										<form method="post" action={`${base}/members/${m.userId}/remove`}>
											<button type="submit" class={ui.buttonSmall}>
												除外
											</button>
										</form>
										{!transfer && (
											<form method="post" action={`${base}/transfer`}>
												<Hidden name="toUserId" value={m.userId} />
												<button type="submit" class={ui.buttonSmall}>
													オーナーを譲る
												</button>
											</form>
										)}
									</>
								)}
							</li>
						))}
					</ul>
					{!isOwner && (
						<form method="post" action={`${base}/leave`} class="border-t border-line pt-4">
							<button type="submit" class={ui.buttonSecondary}>
								この香典帳から抜ける
							</button>
							<p class="mt-1 text-xs text-muted">
								抜けた後にもう一度参加するには、新しい招待リンクが必要です。
							</p>
						</form>
					)}
				</section>
			</LiveRegion>

			{isOwner && transfer && transfer.fromUserId === userId && (
				<section class={`${ui.card} space-y-3`} aria-labelledby="transfer-pending">
					<h2 id="transfer-pending" class={ui.h2}>
						オーナーの譲渡
					</h2>
					<p class="text-sm">
						{transfer.toName} さんの承諾を待っています（期限: {formatDateTime(transfer.expiresAt)}
						）。
					</p>
					<form method="post" action={`${base}/transfer/cancel`}>
						<button type="submit" class={ui.buttonSecondary}>
							譲渡を取り消す
						</button>
					</form>
				</section>
			)}

			{isOwner && (
				<section class={`${ui.card} space-y-4`} aria-labelledby="invitations">
					<h2 id="invitations" class={ui.h2}>
						招待リンク
					</h2>
					{kouden.status === "active" ? (
						<form method="post" action={`${base}/invitations`} class="space-y-4">
							<fieldset class="space-y-2">
								<legend class={ui.label}>ロール</legend>
								{(["editor", "viewer"] as const).map((role) => (
									<label class="flex items-start gap-2 text-sm">
										<input
											type="radio"
											name="role"
											value={role}
											checked={role === "editor"}
											class="mt-1 accent-accent"
										/>
										<span>
											<span class="font-medium">{ROLES[role]}</span>
											<span class="ml-2 text-muted">{INVITE_ROLE_HELP[role]}</span>
										</span>
									</label>
								))}
							</fieldset>
							<div class="flex flex-wrap gap-4">
								<div class="space-y-1">
									<label for="f-expiresInDays" class={ui.label}>
										有効期限
									</label>
									<select id="f-expiresInDays" name="expiresInDays" class={`${ui.input} w-auto`}>
										{INVITE_EXPIRY_DAYS.map((d) => (
											<option value={String(d)} selected={d === 7}>
												{d} 日
											</option>
										))}
									</select>
								</div>
								<div class="space-y-1">
									<label for="f-maxUses" class={ui.label}>
										使用回数の上限（空欄で無制限）
									</label>
									<input
										id="f-maxUses"
										name="maxUses"
										inputmode="numeric"
										class={`${ui.input} w-32`}
										placeholder="無制限"
									/>
								</div>
							</div>
							<button type="submit" class={ui.buttonPrimary}>
								招待リンクを作成
							</button>
						</form>
					) : (
						<p class="text-sm text-muted">アーカイブ中は招待できません。</p>
					)}
					{invitations.length > 0 && (
						<div class="space-y-2 border-t border-line pt-4">
							<h3 class={ui.h3}>使える招待リンク</h3>
							<ul class="divide-y divide-line text-sm">
								{invitations.map((i) => (
									<li class="flex flex-wrap items-center gap-3 py-2">
										<span class={ui.badge}>{ROLES[i.role]}</span>
										<span>期限 {formatDateTime(i.expiresAt)}</span>
										<span class="text-muted">
											使用 {i.usedCount}
											{i.maxUses !== null && ` / ${i.maxUses}`} 回
										</span>
										{canManage && (
											<form
												method="post"
												action={`${base}/invitations/${i.id}/revoke`}
												class="ml-auto"
											>
												<button type="submit" class={ui.buttonSmall}>
													無効にする
												</button>
											</form>
										)}
									</li>
								))}
							</ul>
						</div>
					)}
				</section>
			)}
		</div>
	);
};
