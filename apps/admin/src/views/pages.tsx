import { formatYen, ROLES } from "@kouden/domain";
import { Field, FormAlert, Input, ui } from "@kouden/ui";
import type { Child, FC } from "hono/jsx";
import type {
	AuditLog,
	Dashboard,
	KoudenDetail,
	KoudenRow,
	LegacyRow,
	PurchaseRow,
	UserDetail,
	UserRow,
} from "../store.ts";
import { formatDateTime } from "./layout.tsx";

const PLAN = { free: "無料", paid: "有料" } as const;
const KOUDEN_STATUS = { active: "利用中", archived: "アーカイブ", deleting: "削除中" } as const;
const SOURCE = { stripe: "Stripe", legacy: "旧サービス", admin: "運営者" } as const;
const PURCHASE_STATUS = { paid: "有効", refunded: "取り消し済み" } as const;

const Table: FC<{ head: string[]; children?: Child }> = ({ head, children }) => (
	<div class="overflow-x-auto rounded-xl border border-line bg-surface">
		<table class={ui.table}>
			<thead>
				<tr>
					{head.map((h) => (
						<th class={ui.th} scope="col">
							{h}
						</th>
					))}
				</tr>
			</thead>
			<tbody>{children}</tbody>
		</table>
	</div>
);

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
	<div class={ui.cardTight}>
		<dt class="text-xs text-muted">{label}</dt>
		<dd class="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
	</div>
);

// ---- ダッシュボード（E10-4） ----------------------------------------------------

export const DashboardPage: FC<{ data: Dashboard }> = ({ data }) => (
	<div class="space-y-6">
		<dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
			<Stat label="ユーザー" value={`${data.users} 人`} />
			<Stat
				label="香典帳（利用中 / アーカイブ）"
				value={`${data.koudens.active} / ${data.koudens.archived}`}
			/>
			<Stat label="有料の香典帳" value={`${data.koudens.paid} 冊`} />
			<Stat label="売上（Stripe・有効な購入）" value={formatYen(data.purchases.revenue)} />
			<Stat label="有効な購入" value={`${data.purchases.paid} 件`} />
			<Stat label="取り消し・返金" value={`${data.purchases.refunded} 件`} />
			<Stat label="いただきもの（全香典帳）" value={`${data.activity.gifts} 件`} />
			<Stat label="30 日以内に更新された香典帳" value={`${data.activity.activeLast30Days} 冊`} />
		</dl>
		<p class="text-xs text-muted">
			いただきものの件数などは、各香典帳の DO が D1
			に書く要約（kouden_stats）の合計です。数秒遅れることがあります。
		</p>
		<section aria-labelledby="months" class="space-y-2">
			<h2 id="months" class={ui.h2}>
				月ごとの推移（日本時間）
			</h2>
			<Table head={["月", "新規ユーザー", "新規香典帳", "購入（Stripe）", "売上"]}>
				{data.months.map((m) => (
					<tr>
						<td class={ui.td}>{m.month}</td>
						<td class={`${ui.td} tabular-nums`}>{m.users}</td>
						<td class={`${ui.td} tabular-nums`}>{m.koudens}</td>
						<td class={`${ui.td} tabular-nums`}>{m.purchases}</td>
						<td class={`${ui.td} tabular-nums`}>{formatYen(m.revenue)}</td>
					</tr>
				))}
			</Table>
		</section>
	</div>
);

// ---- 検索（E10-1） --------------------------------------------------------------

export const SearchPage: FC<{ q: string; users: UserRow[]; koudens: KoudenRow[] }> = ({
	q,
	users,
	koudens,
}) => (
	<div class="space-y-6">
		<form method="get" action="/search" class="flex flex-wrap items-end gap-2">
			<Field label="メールアドレス・表示名・香典帳の名前・ID" name="q" class="grow">
				<Input name="q" type="search" values={{ q }} />
			</Field>
			<button type="submit" class={ui.buttonSecondary}>
				検索
			</button>
		</form>
		{q && (
			<>
				<section aria-labelledby="users" class="space-y-2">
					<h2 id="users" class={ui.h2}>
						ユーザー（{users.length}）
					</h2>
					<UsersTable users={users} />
				</section>
				<section aria-labelledby="koudens" class="space-y-2">
					<h2 id="koudens" class={ui.h2}>
						香典帳（{koudens.length}）
					</h2>
					<KoudensTable koudens={koudens} />
				</section>
			</>
		)}
	</div>
);

const UsersTable: FC<{ users: UserRow[] }> = ({ users }) =>
	users.length === 0 ? (
		<p class="text-sm text-muted">該当なし</p>
	) : (
		<Table head={["表示名", "メールアドレス", "参加", "登録", "状態"]}>
			{users.map((u) => (
				<tr>
					<td class={ui.td}>
						<a href={`/users/${u.id}`} class={ui.link}>
							{u.displayName}
						</a>
					</td>
					<td class={`${ui.td} break-all`}>{u.email}</td>
					<td class={`${ui.td} tabular-nums`}>{u.koudenCount} 冊</td>
					<td class={ui.td}>{formatDateTime(u.createdAt)}</td>
					<td class={ui.td}>
						<UserState user={u} />
					</td>
				</tr>
			))}
		</Table>
	);

const UserState: FC<{ user: UserRow }> = ({ user }) =>
	user.deletedAt ? (
		<span class={ui.badge}>削除済み</span>
	) : user.legacyUserId && !user.googleLinked ? (
		<span class={ui.badge}>旧ユーザー（未ログイン）</span>
	) : (
		<span class={ui.badge}>有効</span>
	);

const KoudensTable: FC<{ koudens: KoudenRow[] }> = ({ koudens }) =>
	koudens.length === 0 ? (
		<p class="text-sm text-muted">該当なし</p>
	) : (
		<Table head={["香典帳", "オーナー", "料金", "状態", "いただきもの", "最終更新"]}>
			{koudens.map((k) => (
				<tr>
					<td class={ui.td}>
						<a href={`/koudens/${k.id}`} class={ui.link}>
							{k.title}
						</a>
					</td>
					<td class={ui.td}>
						{k.ownerName}
						<span class="block text-xs break-all text-muted">{k.ownerEmail}</span>
					</td>
					<td class={ui.td}>{PLAN[k.plan]}</td>
					<td class={ui.td}>{KOUDEN_STATUS[k.status]}</td>
					<td class={`${ui.td} tabular-nums`}>{k.giftCount ?? "—"}</td>
					<td class={ui.td}>{formatDateTime(k.lastActivityAt)}</td>
				</tr>
			))}
		</Table>
	);

// ---- ユーザー・香典帳の詳細 --------------------------------------------------------

export const UserPage: FC<{ user: UserDetail }> = ({ user }) => (
	<div class="space-y-6">
		<dl class={`${ui.card} grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm`}>
			<dt class="text-muted">ID</dt>
			<dd class="font-mono text-xs">{user.id}</dd>
			<dt class="text-muted">メールアドレス</dt>
			<dd class="break-all">{user.email || "—"}</dd>
			<dt class="text-muted">状態</dt>
			<dd>
				<UserState user={user} />
			</dd>
			<dt class="text-muted">登録</dt>
			<dd>{formatDateTime(user.createdAt)}</dd>
			{user.deletedAt && (
				<>
					<dt class="text-muted">削除</dt>
					<dd>{formatDateTime(user.deletedAt)}</dd>
				</>
			)}
			{user.legacy && (
				<>
					<dt class="text-muted">旧サービス</dt>
					<dd>
						{user.legacy.email}（{user.legacy.authProvider === "google" ? "Google" : "メール"}
						ログイン）
						{user.legacy.linkedAt && (
							<span class="block text-xs text-muted">
								{formatDateTime(user.legacy.linkedAt)} に紐づけ（{user.legacy.linkedBy}）
							</span>
						)}
					</dd>
				</>
			)}
		</dl>
		<section aria-labelledby="memberships" class="space-y-2">
			<h2 id="memberships" class={ui.h2}>
				参加している香典帳
			</h2>
			{user.memberships.length === 0 ? (
				<p class="text-sm text-muted">なし</p>
			) : (
				<Table head={["香典帳", "ロール", "料金", "状態"]}>
					{user.memberships.map((m) => (
						<tr>
							<td class={ui.td}>
								<a href={`/koudens/${m.koudenId}`} class={ui.link}>
									{m.title}
								</a>
							</td>
							<td class={ui.td}>{ROLES[m.role]}</td>
							<td class={ui.td}>{PLAN[m.plan]}</td>
							<td class={ui.td}>{KOUDEN_STATUS[m.status as keyof typeof KOUDEN_STATUS]}</td>
						</tr>
					))}
				</Table>
			)}
		</section>
		<section aria-labelledby="purchases" class="space-y-2">
			<h2 id="purchases" class={ui.h2}>
				購入
			</h2>
			<PurchasesTable purchases={user.purchases} showKouden />
		</section>
	</div>
);

/** 香典帳の詳細。children に操作結果のお知らせを入れる */
export const KoudenPage: FC<{ kouden: KoudenDetail; children?: Child }> = ({
	kouden,
	children,
}) => (
	<div class="space-y-6">
		{children}
		<dl class={`${ui.card} grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm`}>
			<dt class="text-muted">ID</dt>
			<dd class="font-mono text-xs">{kouden.id}</dd>
			<dt class="text-muted">オーナー</dt>
			<dd>
				<a href={`/users/${kouden.ownerId}`} class={ui.link}>
					{kouden.ownerName}
				</a>
				<span class="ml-2 break-all text-muted">{kouden.ownerEmail}</span>
			</dd>
			<dt class="text-muted">料金</dt>
			<dd>{PLAN[kouden.plan]}</dd>
			<dt class="text-muted">状態</dt>
			<dd>{KOUDEN_STATUS[kouden.status]}</dd>
			<dt class="text-muted">作成</dt>
			<dd>{formatDateTime(kouden.createdAt)}</dd>
			<dt class="text-muted">件数</dt>
			<dd>
				いただきもの {kouden.giftCount ?? "—"} 件・差出人 {kouden.personCount ?? "—"}{" "}
				人・香典返しの未対応 {kouden.returnPending ?? "—"} 人
				<span class="block text-xs text-muted">
					最終更新 {formatDateTime(kouden.lastActivityAt) || "—"}（中身は表示しません）
				</span>
			</dd>
		</dl>
		<section aria-labelledby="members" class="space-y-2">
			<h2 id="members" class={ui.h2}>
				メンバー
			</h2>
			<Table head={["表示名", "メールアドレス", "ロール", "参加"]}>
				{kouden.members.map((m) => (
					<tr>
						<td class={ui.td}>
							<a href={`/users/${m.userId}`} class={ui.link}>
								{m.displayName}
							</a>
						</td>
						<td class={`${ui.td} break-all`}>{m.email}</td>
						<td class={ui.td}>{ROLES[m.role]}</td>
						<td class={ui.td}>{formatDateTime(m.joinedAt)}</td>
					</tr>
				))}
			</Table>
		</section>
		<section aria-labelledby="purchases" class="space-y-3">
			<h2 id="purchases" class={ui.h2}>
				購入
			</h2>
			<PurchasesTable purchases={kouden.purchases} revocable />
			<p class="text-xs text-muted">
				Stripe の購入の返金は Stripe
				のダッシュボードで行ってください（返金の通知で自動的に取り消され、無料に戻ります）。
				ここでの取り消しは返金を伴いません。
			</p>
			{kouden.plan === "free" && kouden.status !== "deleting" && (
				<form
					method="post"
					action={`/koudens/${kouden.id}/grant`}
					class={`${ui.cardTight} space-y-3`}
				>
					<h3 class={ui.h3}>手動で有料にする</h3>
					<ReasonField idPrefix="grant" />
					<button type="submit" class={ui.buttonSecondary}>
						有料にする（0 円の購入として記録）
					</button>
				</form>
			)}
		</section>
	</div>
);

const ReasonField: FC<{ idPrefix: string }> = ({ idPrefix }) => (
	<Field label="理由（監査ログに残ります）" name="reason" idPrefix={idPrefix}>
		<Input name="reason" idPrefix={idPrefix} values={{}} required maxlength={200} />
	</Field>
);

const PurchasesTable: FC<{
	purchases: PurchaseRow[];
	showKouden?: boolean;
	revocable?: boolean;
}> = ({ purchases, showKouden, revocable }) =>
	purchases.length === 0 ? (
		<p class="text-sm text-muted">なし</p>
	) : (
		<Table
			head={[
				...(showKouden ? ["香典帳"] : []),
				"日時",
				"経路",
				"購入者",
				"金額",
				"状態",
				...(revocable ? ["取り消し"] : []),
			]}
		>
			{purchases.map((p) => (
				<tr>
					{showKouden && (
						<td class={ui.td}>
							<a href={`/koudens/${p.koudenId}`} class={ui.link}>
								{p.koudenTitle ?? `（削除済み ${p.koudenId}）`}
							</a>
						</td>
					)}
					<td class={ui.td}>{formatDateTime(p.createdAt)}</td>
					<td class={ui.td}>
						{SOURCE[p.source]}
						{p.stripeCheckoutSessionId && (
							<span class="block font-mono text-xs break-all text-muted">
								{p.stripeCheckoutSessionId}
							</span>
						)}
					</td>
					<td class={ui.td}>{p.buyerName ?? "—"}</td>
					<td class={`${ui.td} tabular-nums`}>{formatYen(p.amount)}</td>
					<td class={ui.td}>
						{PURCHASE_STATUS[p.status]}
						{p.refundedAt && (
							<span class="block text-xs text-muted">{formatDateTime(p.refundedAt)}</span>
						)}
					</td>
					{revocable && (
						<td class={ui.td}>
							{p.status === "paid" && (
								<form
									method="post"
									action={`/purchases/${p.id}/revoke`}
									class="flex flex-wrap gap-2"
								>
									<label for={`revoke-${p.id}`} class="sr-only">
										取り消しの理由
									</label>
									<input
										id={`revoke-${p.id}`}
										name="reason"
										required
										maxlength={200}
										placeholder="理由"
										class={`${ui.input} w-40`}
									/>
									<button type="submit" class={ui.buttonSmall}>
										取り消す
									</button>
								</form>
							)}
						</td>
					)}
				</tr>
			))}
		</Table>
	);

// ---- 旧ユーザーの紐づけ（E10-2） ------------------------------------------------------

export const LegacyListPage: FC<{ q: string; unlinkedOnly: boolean; rows: LegacyRow[] }> = ({
	q,
	unlinkedOnly,
	rows,
}) => (
	<div class="space-y-6">
		<p class="text-sm text-muted">
			旧サービスでメールログインしていて、自動で紐づかなかった人（Gmail・Google Workspace
			以外のアドレスなど）を、本人確認のうえ新しい Google アカウントに紐づけます（ADR-P17）。
		</p>
		<form method="get" action="/legacy" class="flex flex-wrap items-end gap-3">
			<Field label="旧サービスのメールアドレス・名前" name="q" class="grow">
				<Input name="q" type="search" values={{ q }} />
			</Field>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" name="all" value="1" checked={!unlinkedOnly} class="size-4" />
				紐づけ済みも表示
			</label>
			<button type="submit" class={ui.buttonSecondary}>
				検索
			</button>
		</form>
		{rows.length === 0 ? (
			<p class="text-sm text-muted">該当なし</p>
		) : (
			<Table head={["旧サービスのメールアドレス", "名前", "ログイン方法", "香典帳", "状態"]}>
				{rows.map((r) => (
					<tr>
						<td class={`${ui.td} break-all`}>{r.email}</td>
						<td class={ui.td}>{r.displayName ?? "—"}</td>
						<td class={ui.td}>{r.authProvider === "google" ? "Google" : "メール"}</td>
						<td class={`${ui.td} tabular-nums`}>{r.koudenCount} 冊</td>
						<td class={ui.td}>
							{r.linkedUserId ? (
								<>
									<a href={`/users/${r.linkedUserId}`} class={ui.link}>
										紐づけ済み
									</a>
									<span class="block text-xs text-muted">
										{formatDateTime(r.linkedAt)}（{r.linkedBy}）
									</span>
								</>
							) : (
								<a href={`/legacy/${r.legacyUserId}/link`} class={ui.buttonSmall}>
									紐づける
								</a>
							)}
						</td>
					</tr>
				))}
			</Table>
		)}
	</div>
);

export const LinkPage: FC<{
	legacy: LegacyRow;
	email: string;
	candidates: UserRow[];
	error?: string | undefined;
}> = ({ legacy, email, candidates, error }) => (
	<div class="space-y-6">
		<FormAlert message={error} />
		<dl class={`${ui.card} grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm`}>
			<dt class="text-muted">旧サービスのメールアドレス</dt>
			<dd class="break-all">{legacy.email}</dd>
			<dt class="text-muted">名前</dt>
			<dd>{legacy.displayName ?? "—"}</dd>
			<dt class="text-muted">参加している香典帳</dt>
			<dd>{legacy.koudenCount} 冊</dd>
		</dl>
		<form
			method="get"
			action={`/legacy/${legacy.legacyUserId}/link`}
			class="flex flex-wrap items-end gap-2"
		>
			<Field label="本人の新しい Google アカウントのメールアドレス" name="email" class="grow">
				<Input name="email" type="email" values={{ email }} />
			</Field>
			<button type="submit" class={ui.buttonSecondary}>
				アカウントを探す
			</button>
		</form>
		{email &&
			(candidates.length === 0 ? (
				<p class="text-sm text-muted">
					このメールアドレスで Google
					ログインしたアカウントはありません。本人に一度ログインしてもらってください。
				</p>
			) : (
				<ul class="space-y-3">
					{candidates.map((u) => (
						<li class={`${ui.cardTight} space-y-3`}>
							<p class="text-sm">
								<strong>{u.displayName}</strong>（{u.email}）・{formatDateTime(u.createdAt)}{" "}
								登録・参加 {u.koudenCount} 冊
							</p>
							<form method="post" action={`/legacy/${legacy.legacyUserId}/link`} class="space-y-2">
								<input type="hidden" name="targetUserId" value={u.id} />
								<p class="text-xs text-muted">
									このアカウントの Google
									ログインを旧アカウントに移し、このアカウントで参加・作成した香典帳も旧アカウントに寄せます。このアカウントは削除済みになります。本人確認が済んでいることを確認してください。
								</p>
								<button type="submit" class={ui.buttonPrimary}>
									旧アカウントに紐づける
								</button>
							</form>
						</li>
					))}
				</ul>
			))}
	</div>
);

// ---- 監査ログ -----------------------------------------------------------------

export const AuditPage: FC<{ logs: AuditLog[] }> = ({ logs }) =>
	logs.length === 0 ? (
		<p class="text-sm text-muted">まだ記録はありません。</p>
	) : (
		<Table head={["日時", "運営者", "操作", "対象", "内容"]}>
			{logs.map((l) => (
				<tr>
					<td class={ui.td}>{formatDateTime(l.createdAt)}</td>
					<td class={`${ui.td} break-all`}>{l.adminEmail}</td>
					<td class={`${ui.td} font-mono text-xs`}>{l.action}</td>
					<td class={`${ui.td} font-mono text-xs break-all`}>
						{l.targetType}:{l.targetId}
					</td>
					<td class={`${ui.td} font-mono text-xs break-all`}>{l.detail ?? ""}</td>
				</tr>
			))}
		</Table>
	);
