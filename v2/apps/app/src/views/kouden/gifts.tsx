import { formatYen, GIFT_KINDS, type GiftFilter, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { GiftView, LedgerEvent, LedgerRelationship } from "../../ledger/types.ts";
import { Field, Input, Select } from "../components/form.tsx";
import { yen } from "../format.ts";
import { ui } from "../ui.ts";

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
	const kodenTotal = gifts.reduce((sum, g) => sum + (g.kind === "koden" ? (g.amount ?? 0) : 0), 0);
	return (
		<div class="space-y-6">
			{notice && (
				<p role="status" class={ui.notice}>
					{notice}
				</p>
			)}
			<form method="get" action={`${base}/gifts`} class={`${ui.cardTight} space-y-3`} role="search">
				<div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
					<Field label="氏名・カナ・団体・住所" name="q" class="sm:col-span-3 lg:col-span-2">
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

			<p class="text-sm text-muted" role="status">
				{gifts.length} 件・香典 {formatYen(kodenTotal)}
			</p>

			{gifts.length === 0 ? (
				<p class={`${ui.cardTight} text-center text-muted`}>
					{filtered ? "条件に合ういただきものはありません。" : "まだ登録がありません。"}
				</p>
			) : (
				<div class="overflow-x-auto rounded-xl border border-line bg-surface">
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
										</td>
										<td class={`${ui.td} hidden sm:table-cell`}>
											{primary?.relationshipName ?? ""}
										</td>
										<td class={`${ui.td} whitespace-nowrap`}>{GIFT_KINDS[g.kind]}</td>
										<td class={`${ui.td} text-right whitespace-nowrap tabular-nums`}>
											{yen(g.amount)}
										</td>
										<td class={`${ui.td} hidden text-muted md:table-cell`}>
											{[g.itemName, g.quantity !== null ? `×${g.quantity}` : null, g.notes]
												.filter(Boolean)
												.join(" ")}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};
