import { SHEET_COLUMNS, type SheetColumn } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { LedgerEvent, LedgerRelationship } from "../../ledger/types.ts";
import { ui } from "@kouden/ui";
import { yen } from "../format.ts";
import { EntrySummary, type EntrySummaryData } from "./gift-new.tsx";

/** 表の 1 行。表で直せない行（連名・香典以外）は reason を付けて読み取り専用で出す */
export interface SheetRowView {
	key: string;
	giftId?: string | undefined;
	giftVersion?: number | undefined;
	personId?: string | undefined;
	personVersion?: number | undefined;
	receiptNo: number | null;
	values: Record<SheetColumn, string>;
	/** 読み取り専用の理由（連名・供花など）。なければ表で直せる */
	readOnlyReason?: string | undefined;
	/** 読み取り専用の行に出す金額 */
	amount?: number | null;
	/** 団体名だけの差出人の団体名（氏名の欄に薄く出す） */
	namePlaceholder?: string | undefined;
}

const COLUMN_LABELS: Record<SheetColumn, string> = {
	name: "氏名",
	nameKana: "ふりがな",
	amount: "金額",
	postalCode: "郵便番号",
	address: "住所",
	relationshipId: "関係",
};

/** 列の幅（金額は右寄せ） */
const COLUMN_CLASS: Record<SheetColumn, string> = {
	name: "min-w-36",
	nameKana: "min-w-36",
	amount: "min-w-28",
	postalCode: "min-w-28",
	address: "min-w-72",
	relationshipId: "min-w-28",
};

/** はじめに出す空の行の数（Enter で最後の行を越えると足す） */
export const BLANK_ROWS = 5;

const cellInput =
	"block w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm text-ink hover:border-line focus:border-accent focus:bg-surface aria-[invalid=true]:border-danger";

/** 表で入力（08 案 C。PC だけ）。行事の合計・表・行を足すボタン */
export const GiftSheetPage: FC<{
	kouden: KoudenContext;
	events: LedgerEvent[];
	eventId: string;
	relationships: LedgerRelationship[];
	summary: EntrySummaryData;
	rows: SheetRowView[];
}> = ({ kouden, events, eventId, relationships, summary, rows }) => {
	const base = `/k/${kouden.id}`;
	const options = relationships.filter((r) => !r.isHidden);
	const blank: SheetRowView = {
		key: "",
		receiptNo: null,
		values: Object.fromEntries(SHEET_COLUMNS.map((c) => [c, ""])) as Record<SheetColumn, string>,
	};
	return (
		<div class="space-y-4">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class={ui.h2}>表で入力</h2>
				<p class="flex gap-4 text-sm">
					<a href={`${base}/gifts/new?event=${eventId}`} class={ui.link}>
						1 件ずつ登録する
					</a>
					<a href={`${base}/gifts`} class={ui.link}>
						一覧に戻る
					</a>
				</p>
			</div>

			{events.length > 1 && (
				<nav aria-label="行事" class="flex flex-wrap gap-2">
					{events.map((e) => (
						<a
							href={`${base}/gifts/sheet?event=${e.id}`}
							aria-current={e.id === eventId ? "page" : undefined}
							class={`rounded-full border px-4 py-1.5 text-sm ${
								e.id === eventId
									? "border-accent bg-accent text-surface"
									: "border-line bg-surface text-ink hover:bg-paper"
							}`}
						>
							{e.name}
						</a>
					))}
				</nav>
			)}

			<EntrySummary kouden={kouden} summary={summary} />

			<p class={`${ui.notice} md:hidden`}>
				表での入力はパソコン（画面の幅が 768px 以上）向けです。スマホでは{" "}
				<a href={`${base}/gifts/new?event=${eventId}`} class={ui.link}>
					1 件ずつの登録
				</a>
				を使ってください。
			</p>

			<div class="hidden space-y-3 md:block">
				<p class="text-sm text-muted">
					Tab で右の欄、Enter で次の行、↑↓ で上下の行へ移ります。行を離れると保存します。Excel
					などから複数の行・列を貼り付けると、まとめて保存します。ここで登録するのは香典です（供物・供花・弔電は
					1 件ずつの登録で）。
				</p>
				<noscript>
					<p class={ui.alert}>
						表での入力には JavaScript が必要です。
						<a href={`${base}/gifts/new?event=${eventId}`} class={ui.link}>
							1 件ずつ登録する
						</a>
					</p>
				</noscript>
				<div class="overflow-x-auto rounded-xl border border-line bg-surface">
					<table
						class={ui.table}
						data-gift-sheet
						data-endpoint={`${base}/gifts/sheet`}
						data-summary-url={`${base}/gifts/new?partial=summary&eventId=${eventId}`}
						data-event-id={eventId}
					>
						<caption class="sr-only">香典を表で入力する</caption>
						<thead>
							<tr>
								<th class={`${ui.th} w-16 border-r text-right`} scope="col">
									番号
								</th>
								{SHEET_COLUMNS.map((c) => (
									<th
										class={`${ui.th} border-r ${COLUMN_CLASS[c]} ${c === "amount" ? "text-right" : ""}`}
										scope="col"
									>
										{COLUMN_LABELS[c]}
									</th>
								))}
								<th class={`${ui.th} min-w-40`} scope="col">
									状態
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, i) => (
								<SheetRow kouden={kouden} row={row} position={i + 1} options={options} />
							))}
							{Array.from({ length: BLANK_ROWS }, (_, i) => (
								<SheetRow
									kouden={kouden}
									row={{ ...blank, key: `new-${i}` }}
									position={rows.length + i + 1}
									options={options}
								/>
							))}
						</tbody>
					</table>
				</div>
				<button type="button" data-sheet-add class={ui.buttonSecondary}>
					行を足す
				</button>
				{/* gift-sheet.js が行を足すときの見本 */}
				<template data-sheet-row>
					<SheetRow kouden={kouden} row={blank} position={0} options={options} />
				</template>
			</div>
			<script src={`/assets/gift-sheet.js?v=${__ASSET_VERSION__}`} defer></script>
		</div>
	);
};

const SheetRow: FC<{
	kouden: KoudenContext;
	row: SheetRowView;
	position: number;
	options: LedgerRelationship[];
}> = ({ kouden, row, position, options }) => {
	const statusId = row.key ? `sheet-status-${row.key}` : undefined;
	if (row.readOnlyReason) {
		return (
			<tr data-row data-key={row.key} class="bg-paper text-muted">
				<td class={`${ui.td} text-right tabular-nums`}>{row.receiptNo ?? ""}</td>
				<td class={ui.td}>{row.values.name}</td>
				<td class={ui.td}>{row.values.nameKana}</td>
				<td class={`${ui.td} text-right tabular-nums`}>{yen(row.amount ?? null)}</td>
				<td class={ui.td}>{row.values.postalCode}</td>
				<td class={ui.td}>{row.values.address}</td>
				<td class={ui.td}>{options.find((r) => r.id === row.values.relationshipId)?.name ?? ""}</td>
				<td class={`${ui.td} text-xs`}>
					{row.readOnlyReason}は表では直せません。{" "}
					<a href={`/k/${kouden.id}/gifts/${row.giftId}`} class={ui.link}>
						直す
					</a>
				</td>
			</tr>
		);
	}
	const where = row.receiptNo !== null ? `番号 ${row.receiptNo}` : `${position} 行目`;
	return (
		<tr
			data-row
			data-editable="1"
			data-postal-scope
			data-key={row.key || undefined}
			data-no={row.receiptNo?.toString()}
			data-gift-id={row.giftId}
			data-gift-version={row.giftVersion?.toString()}
			data-person-id={row.personId}
			data-person-version={row.personVersion?.toString()}
		>
			<td class={`${ui.td} border-r text-right text-muted tabular-nums`} data-no>
				{row.receiptNo ?? ""}
			</td>
			{SHEET_COLUMNS.map((c) => (
				<td class="border-r border-b border-line px-1 py-1">
					{c === "relationshipId" ? (
						<select
							data-col={c}
							data-label={COLUMN_LABELS[c]}
							aria-label={`${COLUMN_LABELS[c]}（${where}）`}
							class={cellInput}
						>
							<option value="">（未選択）</option>
							{options.map((r) => (
								<option value={r.id} selected={r.id === row.values.relationshipId}>
									{r.name}
								</option>
							))}
						</select>
					) : (
						<input
							data-col={c}
							data-label={COLUMN_LABELS[c]}
							aria-label={`${COLUMN_LABELS[c]}（${where}）`}
							value={row.values[c]}
							autocomplete="off"
							inputmode={c === "amount" || c === "postalCode" ? "numeric" : undefined}
							placeholder={c === "name" ? row.namePlaceholder : undefined}
							class={`${cellInput} ${c === "amount" ? "text-right tabular-nums" : ""}`}
							{...(c === "postalCode" ? { "data-postal-code": "" } : {})}
							{...(c === "address" ? { "data-address": "" } : {})}
						/>
					)}
				</td>
			))}
			<td class={`${ui.td} text-xs`} data-status id={statusId}></td>
		</tr>
	);
};
