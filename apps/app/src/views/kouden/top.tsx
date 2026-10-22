import { can, FREE_GIFT_LIMIT, GIFT_KINDS, formatYen, personLabel } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { Caller, Overview } from "../../ledger/types.ts";
import { formatDate, formatDateTime, yen } from "../format.ts";
import { EmptyState, ui } from "@kouden/ui";
import { LiveRegion } from "./shell.tsx";

/** 香典帳トップ: 合計・行事別・種別別・関係別・最近の登録（E7-1）。他の人の変更で取り直す（E8-1） */
export const KoudenTopPage: FC<{ kouden: KoudenContext; caller: Caller; overview: Overview }> = ({
	kouden,
	caller,
	overview,
}) => {
	const base = `/k/${kouden.id}`;
	const { totals } = overview;
	return (
		<LiveRegion
			id="overview"
			entities={["gift", "person", "event", "relationship", "plan"]}
			url={`${base}?partial=overview`}
			class="space-y-8"
		>
			{kouden.title !== `故 ${kouden.deceasedName} 様` && (
				<p class="text-muted">故 {kouden.deceasedName} 様</p>
			)}

			<section aria-labelledby="totals" class="space-y-4">
				<h2 id="totals" class="sr-only">
					合計
				</h2>
				<dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<Stat label="香典の合計" value={formatYen(totals.kodenTotal)} />
					<Stat label="香典の件数" value={`${totals.kodenCount} 件`} />
					<Stat label="いただきもの（全種別）" value={`${totals.giftCount} 件`} />
					<Stat label="差出人" value={`${totals.personCount} 人`} />
				</dl>
				{kouden.plan === "free" && (
					<p class="text-sm text-muted">
						無料版: {FREE_GIFT_LIMIT} 件まで登録できます（残り{" "}
						{Math.max(0, FREE_GIFT_LIMIT - totals.giftCount)} 件）。{" "}
						<a href={`${base}/settings#billing`} class={ui.link}>
							{kouden.memberRole === "owner" ? "有料版を購入する" : "有料版について"}
						</a>
					</p>
				)}
				{can(caller.role, "ledger.write") && (
					<a href={`${base}/gifts/new`} class={`${ui.buttonPrimary} w-full sm:w-auto`}>
						いただきものを登録する
					</a>
				)}
			</section>

			<div class="grid gap-6 lg:grid-cols-3">
				<SummaryTable
					title="行事別"
					rows={overview.byEvent.map((e) => ({
						label: e.date ? `${e.name}（${formatDate(e.date)}）` : e.name,
						href: `${base}/gifts?event=${e.eventId}`,
						count: e.count,
						amount: e.kodenTotal,
					}))}
					amountLabel="香典"
				/>
				<SummaryTable
					title="種別"
					rows={overview.byKind.map((k) => ({
						label: GIFT_KINDS[k.kind],
						href: `${base}/gifts?kind=${k.kind}`,
						count: k.count,
						amount: k.amount,
					}))}
					amountLabel="金額"
				/>
				<SummaryTable
					title="関係別（代表者）"
					rows={overview.byRelationship.map((r) => ({
						label: r.name ?? "未設定",
						href: r.relationshipId ? `${base}/gifts?relationship=${r.relationshipId}` : undefined,
						count: r.count,
						amount: r.kodenTotal,
					}))}
					amountLabel="香典"
				/>
			</div>

			<section aria-labelledby="recent" class="space-y-3">
				<div class="flex items-baseline justify-between">
					<h2 id="recent" class={ui.h2}>
						最近の登録
					</h2>
					<a href={`${base}/gifts`} class={`${ui.link} text-sm`}>
						すべて見る
					</a>
				</div>
				{overview.recent.length === 0 ? (
					<EmptyState
						compact
						title="まだ登録がありません"
						description="いただきものを登録すると、ここに新しい順に並びます。"
					/>
				) : (
					<ul class="divide-y divide-line rounded-xl border border-line bg-surface">
						{overview.recent.map((g) => (
							<li>
								<a
									href={`${base}/gifts/${g.id}`}
									class="flex flex-wrap items-baseline gap-x-3 px-4 py-3 hover:bg-paper"
								>
									<span class="text-sm text-muted">
										{g.eventName} {g.receiptNo !== null && `No.${g.receiptNo}`}
									</span>
									<span class="font-medium">
										{g.contributors[0] ? personLabel(g.contributors[0]) : ""}
										{g.contributors.length > 1 && ` ほか ${g.contributors.length - 1} 名`}
									</span>
									<span class="text-sm">
										{GIFT_KINDS[g.kind]} {g.amount !== null && yen(g.amount)}
									</span>
									<span class="ml-auto text-xs text-muted">{formatDateTime(g.createdAt)}</span>
								</a>
							</li>
						))}
					</ul>
				)}
			</section>
		</LiveRegion>
	);
};

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
	<div class={ui.cardTight}>
		<dt class="text-xs text-muted">{label}</dt>
		<dd class="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
	</div>
);

const SummaryTable: FC<{
	title: string;
	amountLabel: string;
	rows: { label: string; href?: string | undefined; count: number; amount: number }[];
}> = ({ title, amountLabel, rows }) => (
	<section class={ui.cardTight}>
		<h2 class={`${ui.h3} mb-2`}>{title}</h2>
		{rows.length === 0 ? (
			<p class="text-sm text-muted">—</p>
		) : (
			<table class={ui.table}>
				<thead>
					<tr>
						<th class={ui.th} scope="col">
							<span class="sr-only">項目</span>
						</th>
						<th class={`${ui.th} text-right`} scope="col">
							件数
						</th>
						<th class={`${ui.th} text-right`} scope="col">
							{amountLabel}
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr>
							<th scope="row" class={`${ui.td} text-left font-normal`}>
								{r.href ? (
									<a href={r.href} class="hover:underline">
										{r.label}
									</a>
								) : (
									r.label
								)}
							</th>
							<td class={`${ui.td} text-right tabular-nums`}>{r.count}</td>
							<td class={`${ui.td} text-right tabular-nums`}>{formatYen(r.amount)}</td>
						</tr>
					))}
				</tbody>
			</table>
		)}
	</section>
);
