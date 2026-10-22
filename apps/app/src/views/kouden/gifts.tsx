import { can, formatYen, GIFT_KINDS, type GiftFilter, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { GiftView, LedgerEvent, LedgerRelationship } from "../../ledger/types.ts";
import { EmptyState, Field, Input, Select, ui } from "@kouden/ui";
import { yen } from "../format.ts";
import { LiveRegion } from "./shell.tsx";

/** 閲覧者・アーカイブ中は登録の画面を開けない */
const canRegister = (kouden: KoudenContext) =>
	can(kouden.memberRole, "ledger.write") && kouden.status === "active";

/** いただきもの一覧（E4-6 の絞り込み・検索） */
export const GiftsPage: FC<{
	kouden: KoudenContext;
	gifts: GiftView[];
	events: LedgerEvent[];
	relationships: LedgerRelationship[];
	filter: GiftFilter;
	notice?: string | undefined;
}> = ({ kouden, gifts, events, relationships, filter, notice }) => {
	const base = `/k/${kouden.id}`;
	const values = {
		event: filter.eventId,
		kind: filter.kind,
		relationship: filter.relationshipId,
		q: filter.q,
		min: filter.minAmount?.toString(),
		max: filter.maxAmount?.toString(),
	};
	const filtered = Object.values(values).some((v) => v !== undefined);
	return (
		<div class="space-y-6">
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}
			{canRegister(kouden) && (
				<a href={`${base}/gifts/new`} class={`${ui.buttonPrimary} w-full sm:w-auto`}>
					いただきものを登録する
				</a>
			)}
			<form method="get" action={`${base}/gifts`} class={`${ui.cardTight} space-y-3`} role="search">
				<div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
					<Field label="番号・氏名・カナ・団体・住所" name="q" class="sm:col-span-3 lg:col-span-2">
						<Input name="q" values={values} type="search" inputmode="search" />
					</Field>
					<Field label="行事" name="event">
						<Select
							name="event"
							values={values}
							blank="すべて"
							options={events.map((e) => ({ value: e.id, label: e.name }))}
						/>
					</Field>
					<Field label="種別" name="kind">
						<Select
							name="kind"
							values={values}
							blank="すべて"
							options={Object.entries(GIFT_KINDS).map(([value, label]) => ({ value, label }))}
						/>
					</Field>
					<Field label="関係（代表者）" name="relationship">
						<Select
							name="relationship"
							values={values}
							blank="すべて"
							options={relationships.map((r) => ({ value: r.id, label: r.name }))}
						/>
					</Field>
					<fieldset class="space-y-1">
						<legend class={ui.label}>金額</legend>
						<div class="flex items-center gap-1">
							<label for="f-min" class="sr-only">
								金額の下限
							</label>
							<Input name="min" values={values} inputmode="numeric" placeholder="下限" />
							<span aria-hidden="true">〜</span>
							<label for="f-max" class="sr-only">
								金額の上限
							</label>
							<Input name="max" values={values} inputmode="numeric" placeholder="上限" />
						</div>
					</fieldset>
				</div>
				<div class="flex gap-2">
					<button type="submit" class={ui.buttonSecondary}>
						絞り込む
					</button>
					{filtered && (
						<a href={`${base}/gifts`} class={`${ui.link} self-center text-sm`}>
							条件をクリア
						</a>
					)}
				</div>
			</form>

			<GiftResults kouden={kouden} gifts={gifts} filter={filter} />
		</div>
	);
};

/** 一覧の結果部分。他の人の変更を受けると、同じ条件で取り直す */
export const GiftResults: FC<{ kouden: KoudenContext; gifts: GiftView[]; filter: GiftFilter }> = ({
	kouden,
	gifts,
	filter,
}) => {
	const base = `/k/${kouden.id}`;
	const query = new URLSearchParams();
	if (filter.eventId) query.set("event", filter.eventId);
	if (filter.kind) query.set("kind", filter.kind);
	if (filter.relationshipId) query.set("relationship", filter.relationshipId);
	if (filter.q) query.set("q", filter.q);
	if (filter.minAmount !== undefined) query.set("min", String(filter.minAmount));
	if (filter.maxAmount !== undefined) query.set("max", String(filter.maxAmount));
	const filtered = query.size > 0;
	query.set("partial", "results");
	const kodenTotal = gifts.reduce((sum, g) => sum + (g.kind === "koden" ? (g.amount ?? 0) : 0), 0);
	return (
		<LiveRegion
			id="gift-results"
			entities={["gift", "person", "event", "relationship"]}
			url={`${base}/gifts?${query.toString()}`}
			class="space-y-3"
		>
			<p class="text-sm text-muted" role="status">
				{gifts.length} 件・香典 {formatYen(kodenTotal)}
			</p>

			{gifts.length === 0 ? (
				filtered ? (
					<EmptyState
						title="条件に合ういただきものはありません"
						description="条件を変えるか、クリアしてすべてを表示してください。"
					>
						<a href={`${base}/gifts`} class={ui.buttonSecondary}>
							条件をクリア
						</a>
					</EmptyState>
				) : (
					<EmptyState
						title="まだいただきものがありません"
						description="香典・供物・供花・弔電を登録すると、ここに並びます。"
					>
						{canRegister(kouden) && (
							<a href={`${base}/gifts/new`} class={ui.buttonPrimary}>
								いただきものを登録する
							</a>
						)}
					</EmptyState>
				)
			) : (
				<>
					<GiftCards kouden={kouden} gifts={gifts} />
					<GiftTable kouden={kouden} gifts={gifts} />
				</>
			)}
		</LiveRegion>
	);
};

/** 内容の要約（関係・品名・数量・備考）。カードと表で同じものを出す */
const giftDetail = (g: GiftView) =>
	[g.itemName, g.quantity !== null ? `×${g.quantity}` : null, g.notes].filter(Boolean).join(" ");

/**
 * スマホ（md 未満）の一覧。1 件を 1 枚のカードにし、香典袋と照合する番号を左に大きく出す。
 * カード全体が詳細へのリンク
 */
const GiftCards: FC<{ kouden: KoudenContext; gifts: GiftView[] }> = ({ kouden, gifts }) => (
	<ul class="space-y-2 md:hidden">
		{gifts.map((g) => {
			const primary = g.contributors[0];
			const detail = giftDetail(g);
			return (
				<li>
					<a
						href={`/k/${kouden.id}/gifts/${g.id}`}
						class="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-paper"
					>
						<span class="w-14 shrink-0 text-center">
							<span class="block text-xs text-muted">{g.eventName}</span>
							<span class="block text-lg leading-tight font-semibold tabular-nums">
								{g.receiptNo !== null ? `No.${g.receiptNo}` : "—"}
							</span>
						</span>
						<span class="min-w-0 flex-1">
							<span class="block font-medium break-words">
								{primary ? personLabel(primary) : "（差出人なし）"}
								{g.contributors.length > 1 && (
									<span class="ml-1 text-sm font-normal text-muted">
										ほか {g.contributors.length - 1} 名
									</span>
								)}
							</span>
							<span class="block text-sm text-muted">
								{[GIFT_KINDS[g.kind], primary?.relationshipName].filter(Boolean).join("・")}
							</span>
							{detail && <span class="block truncate text-sm text-muted">{detail}</span>}
							<span data-editing-target={`gift:${g.id}`} class="block text-xs text-danger"></span>
						</span>
						<span class="shrink-0 text-right font-medium whitespace-nowrap tabular-nums">
							{yen(g.amount)}
						</span>
					</a>
				</li>
			);
		})}
	</ul>
);

/** PC（md 以上）の一覧 */
const GiftTable: FC<{ kouden: KoudenContext; gifts: GiftView[] }> = ({ kouden, gifts }) => {
	const base = `/k/${kouden.id}`;
	return (
		<div class="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
			<table class={ui.table}>
				<thead>
					<tr>
						<th class={ui.th} scope="col">
							行事・番号
						</th>
						<th class={ui.th} scope="col">
							差出人
						</th>
						<th class={`${ui.th} hidden sm:table-cell`} scope="col">
							関係
						</th>
						<th class={ui.th} scope="col">
							種別
						</th>
						<th class={`${ui.th} text-right`} scope="col">
							金額
						</th>
						<th class={`${ui.th} hidden md:table-cell`} scope="col">
							品名・備考
						</th>
					</tr>
				</thead>
				<tbody>
					{gifts.map((g) => {
						const primary = g.contributors[0];
						return (
							<tr class="hover:bg-paper">
								<td class={`${ui.td} whitespace-nowrap`}>
									<span class="text-muted">{g.eventName}</span>{" "}
									<span class="tabular-nums">{g.receiptNo ?? ""}</span>
								</td>
								<td class={ui.td}>
									<a href={`${base}/gifts/${g.id}`} class="font-medium hover:underline">
										{primary ? personLabel(primary) : "（差出人なし）"}
									</a>
									{g.contributors.length > 1 && (
										<span class="ml-1 text-muted">ほか {g.contributors.length - 1} 名</span>
									)}
									<span
										data-editing-target={`gift:${g.id}`}
										class="block text-xs text-danger"
									></span>
								</td>
								<td class={`${ui.td} hidden sm:table-cell`}>{primary?.relationshipName ?? ""}</td>
								<td class={`${ui.td} whitespace-nowrap`}>{GIFT_KINDS[g.kind]}</td>
								<td class={`${ui.td} text-right whitespace-nowrap tabular-nums`}>
									{yen(g.amount)}
								</td>
								<td class={`${ui.td} hidden text-muted md:table-cell`}>{giftDetail(g)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
