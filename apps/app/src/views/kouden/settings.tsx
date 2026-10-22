import {
	can,
	EVENT_KINDS,
	type FieldErrors,
	FREE_GIFT_LIMIT,
	formatYen,
	PAID_PRICE_JPY,
} from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { PurchaseView } from "../../billing/purchases.ts";
import type { KoudenContext } from "../../kouden/store.ts";
import type { Caller, LedgerEvent, LedgerRelationship } from "../../ledger/types.ts";
import { Field, FormAlert, type FormValues, Hidden, Input, Select, ui } from "@kouden/ui";
import { formatDate, jstDateOf } from "../format.ts";
import { LiveRegion } from "./shell.tsx";

const EVENT_KIND_OPTIONS = Object.entries(EVENT_KINDS).map(([value, label]) => ({ value, label }));

/** 設定: 香典帳の情報・有料版（E9）・行事（E2-2）・関係（E5-3）・アーカイブと削除（E2-4） */
export const SettingsPage: FC<{
	kouden: KoudenContext;
	caller: Caller;
	events: LedgerEvent[];
	relationships: LedgerRelationship[];
	/** 直前の操作のエラー（ページ上部に出す） */
	error?: string | undefined;
	notice?: string | undefined;
	koudenValues: FormValues;
	koudenErrors?: FieldErrors;
	deleteError?: string | undefined;
	/** 有効な購入（有料版のとき） */
	purchase: PurchaseView | null;
}> = ({
	kouden,
	caller,
	events,
	relationships,
	error,
	notice,
	koudenValues,
	koudenErrors = {},
	deleteError,
	purchase,
}) => {
	const base = `/k/${kouden.id}`;
	const isOwner = kouden.memberRole === "owner";
	const needsConfirmation = kouden.needsDeceasedNameConfirmation;
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

			<section aria-labelledby="info" class={`${ui.card} space-y-4`}>
				<h2 id="info" class={ui.h2}>
					香典帳の情報
				</h2>
				{isOwner && kouden.status === "active" ? (
					<form
						method="post"
						action={`${base}/settings/${needsConfirmation ? "confirm-deceased-name" : "kouden"}`}
						class="space-y-4"
						novalidate
					>
						{needsConfirmation && (
							<p class="text-sm">
								故人のお名前を確認し、必要に応じて修正してください。確認して保存すると、確認の案内は表示されなくなります。
							</p>
						)}
						<FormAlert errors={koudenErrors} />
						<div class="grid gap-4 sm:grid-cols-2">
							<Field
								label="故人のお名前"
								name="deceasedName"
								error={koudenErrors.deceasedName}
								required
							>
								<Input
									name="deceasedName"
									values={koudenValues}
									errors={koudenErrors}
									required
									maxlength={50}
								/>
							</Field>
							<Field label="香典帳の名前" name="title" error={koudenErrors.title}>
								<Input name="title" values={koudenValues} errors={koudenErrors} />
							</Field>
						</div>
						<button type="submit" class={ui.buttonSecondary}>
							{needsConfirmation ? "確認して保存する" : "保存する"}
						</button>
					</form>
				) : (
					<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
						<dt class="text-muted">故人のお名前</dt>
						<dd>{kouden.deceasedName}</dd>
						<dt class="text-muted">香典帳の名前</dt>
						<dd>{kouden.title}</dd>
					</dl>
				)}
			</section>

			<BillingSection kouden={kouden} purchase={purchase} />

			<EventsSection kouden={kouden} caller={caller} events={events} />

			<RelationshipsSection kouden={kouden} caller={caller} relationships={relationships} />

			{isOwner && (
				<section id="archive" aria-labelledby="archive-heading" class={`${ui.card} space-y-4`}>
					<h2 id="archive-heading" class={ui.h2}>
						アーカイブ
					</h2>
					<p class="text-sm text-muted">
						アーカイブすると一覧の「アーカイブ」に移り、メンバー全員が閲覧のみになります。いつでも元に戻せます。
					</p>
					<form method="post" action={`${base}/archive`}>
						<Hidden name="archived" value={kouden.status === "archived" ? "0" : "1"} />
						<button type="submit" class={ui.buttonSecondary}>
							{kouden.status === "archived" ? "アーカイブを解除する" : "アーカイブする"}
						</button>
					</form>
				</section>
			)}

			{isOwner && (
				<section
					id="delete"
					aria-labelledby="delete-heading"
					class="space-y-4 rounded-xl border border-danger/40 bg-surface p-6"
				>
					<h2 id="delete-heading" class={`${ui.h2} text-danger`}>
						香典帳の削除
					</h2>
					<p class="text-sm">
						記録・差出人・設定がすべて完全に削除され、元に戻せません。削除するには香典帳の名前「
						<strong>{kouden.title}</strong>」を入力してください。
					</p>
					<form method="post" action={`${base}/delete`} class="flex flex-wrap items-end gap-2">
						<Field label="香典帳の名前" name="confirm" error={deleteError} class="min-w-60 flex-1">
							<Input
								name="confirm"
								values={{}}
								errors={deleteError ? { confirm: deleteError } : {}}
							/>
						</Field>
						<button type="submit" class={ui.buttonDanger}>
							完全に削除する
						</button>
					</form>
				</section>
			)}
		</div>
	);
};

/** 行事（E2-2）。他の人の変更で取り直す */
export const EventsSection: FC<{
	kouden: KoudenContext;
	caller: Caller;
	events: LedgerEvent[];
}> = ({ kouden, caller, events }) => {
	const base = `/k/${kouden.id}`;
	const canEdit = can(caller.role, "settings.write");
	return (
		<LiveRegion
			id="settings-events"
			entities={["event"]}
			url={`/k/${kouden.id}/settings?partial=events`}
		>
			<section aria-labelledby="events" class={`${ui.card} space-y-4`}>
				<h2 id="events" class={ui.h2}>
					行事
				</h2>
				<p class="text-sm text-muted">
					受付番号は行事ごとに 1 から振ります。記録がある行事は削除できません。
				</p>
				<ul class="space-y-3">
					{events.map((e, i) =>
						canEdit ? (
							<li class="flex flex-wrap items-end gap-2 border-b border-line pb-3">
								<form
									method="post"
									action={`${base}/events/${e.id}`}
									class="flex flex-1 flex-wrap items-end gap-2"
								>
									<Hidden name="version" value={e.version} />
									<Field label="種類" name="kind" idPrefix={`ev-${e.id}`}>
										<Select
											name="kind"
											idPrefix={`ev-${e.id}`}
											values={{ kind: e.kind }}
											options={EVENT_KIND_OPTIONS}
										/>
									</Field>
									<Field label="名前" name="name" idPrefix={`ev-${e.id}`} class="min-w-32 flex-1">
										<Input name="name" idPrefix={`ev-${e.id}`} values={{ name: e.name }} />
									</Field>
									<Field label="日付" name="date" idPrefix={`ev-${e.id}`}>
										<Input
											name="date"
											idPrefix={`ev-${e.id}`}
											type="date"
											values={{ date: e.date ?? undefined }}
										/>
									</Field>
									<button type="submit" class={ui.buttonSmall}>
										保存
									</button>
								</form>
								<MoveButtons
									action={`${base}/events/${e.id}/move`}
									first={i === 0}
									last={i === events.length - 1}
									label={e.name}
								/>
								<form method="post" action={`${base}/events/${e.id}/delete`}>
									<button
										type="submit"
										class={ui.buttonSmall}
										disabled={e.giftCount > 0 || events.length <= 1}
										title={e.giftCount > 0 ? `記録が ${e.giftCount} 件あります` : undefined}
									>
										削除
									</button>
								</form>
								<span class="w-full text-xs text-muted">{e.giftCount} 件</span>
							</li>
						) : (
							<li class="flex gap-3 text-sm">
								<span class="font-medium">{e.name}</span>
								<span class="text-muted">{formatDate(e.date)}</span>
								<span class="text-muted">{e.giftCount} 件</span>
							</li>
						),
					)}
				</ul>
				{canEdit && (
					<form
						method="post"
						action={`${base}/events`}
						class="flex flex-wrap items-end gap-2 border-t border-line pt-4"
					>
						<Field label="種類" name="kind" idPrefix="new-event">
							<Select
								name="kind"
								idPrefix="new-event"
								values={{ kind: "memorial_49" }}
								options={EVENT_KIND_OPTIONS}
							/>
						</Field>
						<Field label="名前（省略可）" name="name" idPrefix="new-event" class="min-w-32 flex-1">
							<Input name="name" idPrefix="new-event" values={{}} />
						</Field>
						<Field label="日付" name="date" idPrefix="new-event">
							<Input name="date" idPrefix="new-event" type="date" values={{}} />
						</Field>
						<button type="submit" class={ui.buttonSecondary}>
							行事を追加
						</button>
					</form>
				)}
			</section>
		</LiveRegion>
	);
};

/** 故人との関係（E5-3）。他の人の変更で取り直す */
export const RelationshipsSection: FC<{
	kouden: KoudenContext;
	caller: Caller;
	relationships: LedgerRelationship[];
}> = ({ kouden, caller, relationships }) => {
	const base = `/k/${kouden.id}`;
	const canEdit = can(caller.role, "settings.write");
	return (
		<LiveRegion
			id="settings-relationships"
			entities={["relationship"]}
			url={`/k/${kouden.id}/settings?partial=relationships`}
		>
			<section aria-labelledby="relationships" class={`${ui.card} space-y-4`}>
				<h2 id="relationships" class={ui.h2}>
					故人との関係
				</h2>
				<p class="text-sm text-muted">
					いただきものの登録で選べる関係です。使用中の関係は削除できませんが、非表示にすると選択肢から外れます。
				</p>
				<ul class="space-y-3">
					{relationships.map((r, i) =>
						canEdit ? (
							<li class="flex flex-wrap items-end gap-2 border-b border-line pb-3">
								<form
									method="post"
									action={`${base}/relationships/${r.id}`}
									class="flex flex-1 items-end gap-2"
								>
									<Hidden name="version" value={r.version} />
									<Field label="名前" name="name" idPrefix={`rel-${r.id}`} class="flex-1">
										<Input name="name" idPrefix={`rel-${r.id}`} values={{ name: r.name }} />
									</Field>
									<button type="submit" class={ui.buttonSmall}>
										保存
									</button>
								</form>
								<MoveButtons
									action={`${base}/relationships/${r.id}/move`}
									first={i === 0}
									last={i === relationships.length - 1}
									label={r.name}
								/>
								<form method="post" action={`${base}/relationships/${r.id}/hide`}>
									<Hidden name="hidden" value={r.isHidden ? "0" : "1"} />
									<button type="submit" class={ui.buttonSmall}>
										{r.isHidden ? "表示する" : "非表示にする"}
									</button>
								</form>
								<form method="post" action={`${base}/relationships/${r.id}/delete`}>
									<button
										type="submit"
										class={ui.buttonSmall}
										disabled={r.personCount > 0}
										title={r.personCount > 0 ? `${r.personCount} 人が使用中です` : undefined}
									>
										削除
									</button>
								</form>
								<span class="w-full text-xs text-muted">
									{r.personCount} 人{r.isHidden && "・非表示中"}
								</span>
							</li>
						) : (
							<li class="text-sm">
								{r.name}
								{r.isHidden && <span class="ml-2 text-muted">（非表示）</span>}
							</li>
						),
					)}
				</ul>
				{canEdit && (
					<form
						method="post"
						action={`${base}/relationships`}
						class="flex items-end gap-2 border-t border-line pt-4"
					>
						<Field label="新しい関係" name="name" idPrefix="new-rel" class="flex-1">
							<Input name="name" idPrefix="new-rel" values={{}} placeholder="例: 学校関係" />
						</Field>
						<button type="submit" class={ui.buttonSecondary}>
							追加
						</button>
					</form>
				)}
			</section>
		</LiveRegion>
	);
};

export const MoveButtons: FC<{ action: string; first: boolean; last: boolean; label: string }> = ({
	action,
	first,
	last,
	label,
}) => (
	<>
		<form method="post" action={action}>
			<Hidden name="direction" value="up" />
			<button type="submit" class={ui.buttonSmall} disabled={first} aria-label={`${label}を上へ`}>
				↑
			</button>
		</form>
		<form method="post" action={action}>
			<Hidden name="direction" value="down" />
			<button type="submit" class={ui.buttonSmall} disabled={last} aria-label={`${label}を下へ`}>
				↓
			</button>
		</form>
	</>
);

/** 有料版（E9-1〜E9-3）。購入はオーナーだけができる */
const BillingSection: FC<{ kouden: KoudenContext; purchase: PurchaseView | null }> = ({
	kouden,
	purchase,
}) => {
	const base = `/k/${kouden.id}`;
	return (
		<section id="billing" aria-labelledby="billing-heading" class={`${ui.card} space-y-4`}>
			<div class="flex flex-wrap items-baseline gap-3">
				<h2 id="billing-heading" class={ui.h2}>
					料金
				</h2>
				<span class={ui.badge}>{kouden.plan === "paid" ? "有料版" : "無料版"}</span>
			</div>
			{kouden.plan === "paid" ? (
				<div class="space-y-2 text-sm">
					<p>有料版です。いただきものの件数に上限はありません。</p>
					{purchase?.source === "stripe" && (
						<p class="text-muted">
							{formatDate(jstDateOf(purchase.createdAt))}に
							{purchase.buyerName ? `${purchase.buyerName}さんが` : ""}購入しました（
							{formatYen(purchase.amount)}）。領収書は購入時に Stripe からメールで届いています。
						</p>
					)}
					{purchase?.source === "legacy" && (
						<p class="text-muted">以前のサービスで購入された香典帳です。</p>
					)}
				</div>
			) : (
				<div class="space-y-4 text-sm">
					<p>
						無料版では、いただきものを {FREE_GIFT_LIMIT} 件まで登録できます。有料版（
						{formatYen(PAID_PRICE_JPY)}
						・税込・買い切り）にすると、この香典帳の件数の上限がなくなります。
					</p>
					{kouden.memberRole !== "owner" ? (
						<p class="text-muted">購入はオーナーが行います。オーナーに依頼してください。</p>
					) : kouden.status !== "active" ? (
						<p class="text-muted">アーカイブを解除すると購入できます。</p>
					) : (
						<form method="post" action={`${base}/billing/checkout`} class="space-y-2">
							<button type="submit" class={ui.buttonPrimary}>
								有料版を購入する（{formatYen(PAID_PRICE_JPY)}）
							</button>
							<p class="text-muted">
								Stripe の決済画面に移動します。領収書はご登録のメールアドレスに届きます。
							</p>
						</form>
					)}
				</div>
			)}
		</section>
	);
};
