import { formatYen, GIFT_KINDS, personLabel, RETURN_STATUSES } from "@kouden/domain";
import { raw } from "hono/html";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { GiftView, OutputData } from "../../ledger/types.ts";
import {
	type AddressRow,
	giftContributors,
	giftsByEvent,
	jointLabel,
	linesLabel,
	type ReturnRow,
} from "../../output/rows.ts";
import { formatDate } from "../format.ts";
import { ui } from "../ui.ts";

/**
 * 印刷用ページ（E7-2, 04 §8）。アプリの枠（ヘッダー・タブ）を付けず、A4 に収まる表だけを出す。
 * 画面で見たときだけ、戻るリンクと「印刷する」ボタンを出す。
 */
const PrintLayout: FC<{
	kouden: KoudenContext;
	title: string;
	/** 表題の下に出す補足（「通夜のみ」など） */
	subtitle?: string | undefined;
	printedAt: Date;
	children?: Child;
}> = ({ kouden, title, subtitle, printedAt, children }) => (
	<>
		{raw("<!DOCTYPE html>")}
		<html lang="ja">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* PDF に保存するときのファイル名の初期値になる */}
				<title>{`${title}_${kouden.title}`}</title>
				<meta name="robots" content="noindex" />
				<link rel="icon" href="data:," />
				<link rel="stylesheet" href={`/assets/app.css?v=${__ASSET_VERSION__}`} />
				<script src={`/assets/print.js?v=${__ASSET_VERSION__}`} defer></script>
			</head>
			<body class="bg-paper font-sans text-ink print:bg-white">
				<a href="#main" class={ui.skipLink}>
					本文へ移動
				</a>
				<div class="mx-auto max-w-[210mm] space-y-4 p-4 print:max-w-none print:p-0">
					<div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
						<a href={`/k/${kouden.id}/output`} class={ui.link}>
							← 印刷・出力に戻る
						</a>
						<button type="button" data-print class={ui.buttonPrimary}>
							印刷する
						</button>
					</div>
					<main
						id="main"
						tabindex={-1}
						class="space-y-6 bg-surface p-6 shadow-sm focus:outline-none print:p-0 print:shadow-none"
					>
						<header class="flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink pb-2">
							<div>
								<h1 class="text-xl font-semibold tracking-widest">{title}</h1>
								<p class="text-sm">
									{kouden.title}
									{subtitle && <span class="ml-2 text-muted">{subtitle}</span>}
								</p>
							</div>
							<p class="text-xs text-muted">{printedLabel(printedAt)} 現在</p>
						</header>
						{children}
					</main>
				</div>
			</body>
		</html>
	</>
);

const printed = new Intl.DateTimeFormat("ja-JP", {
	timeZone: "Asia/Tokyo",
	year: "numeric",
	month: "long",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});
const printedLabel = (d: Date) => printed.format(d);

const Empty: FC<{ children?: Child }> = ({ children }) => (
	<p class="py-8 text-center text-muted">{children}</p>
);

/** いただきものの内容（香典は金額、それ以外は種別・品名・数量） */
function giftContent(g: GiftView): string {
	if (g.kind === "koden") return g.amount === null ? "香典" : formatYen(g.amount);
	const parts: string[] = [GIFT_KINDS[g.kind]];
	if (g.itemName) parts.push(g.itemName);
	let label = parts.join("：");
	if (g.quantity !== null) label += ` × ${g.quantity}`;
	if (g.amount !== null) label += `（${formatYen(g.amount)}）`;
	return label;
}

// ---- 芳名一覧 -------------------------------------------------------------------

export const PrintGiftsPage: FC<{
	kouden: KoudenContext;
	data: OutputData;
	eventId?: string | undefined;
	printedAt: Date;
}> = ({ kouden, data, eventId, printedAt }) => {
	const sections = giftsByEvent(data, eventId);
	const addresses = new Map(data.persons.map((p) => [p.id, p]));
	return (
		<PrintLayout
			kouden={kouden}
			title="芳名一覧"
			subtitle={eventId ? sections[0]?.name : undefined}
			printedAt={printedAt}
		>
			{sections.length === 0 && <Empty>いただきものはまだありません。</Empty>}
			{sections.map((section) => {
				const koden = section.gifts.filter((g) => g.kind === "koden");
				const kodenTotal = koden.reduce((sum, g) => sum + (g.amount ?? 0), 0);
				return (
					<section class="print-section space-y-2">
						<h2 class="font-semibold">
							{section.name}
							{section.date && (
								<span class="ml-2 text-sm font-normal">{formatDate(section.date)}</span>
							)}
						</h2>
						<table class="print-table">
							<thead>
								<tr>
									<th class="w-[3.5em] text-right">番号</th>
									<th class="w-[13em]">ご芳名</th>
									<th>ご住所</th>
									<th class="w-[6em]">関係</th>
									<th class="w-[9em] text-right">内容</th>
								</tr>
							</thead>
							<tbody>
								{section.gifts.map((g) => {
									const { primary, others } = giftContributors(g);
									const person = primary ? addresses.get(primary.personId) : undefined;
									return (
										<tr>
											<td class="text-right tabular-nums">{g.receiptNo ?? ""}</td>
											<td>
												{primary ? personLabel(primary) : ""}
												{others.length > 0 && (
													<span class="block text-[8.5pt]">連名: {jointLabel(others)}</span>
												)}
											</td>
											<td class="text-[9pt]">
												{person?.postalCode && <span class="mr-1">〒{person.postalCode}</span>}
												{person?.address ?? ""}
											</td>
											<td>{primary?.relationshipName ?? ""}</td>
											<td class="text-right tabular-nums">{giftContent(g)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<p class="text-right text-sm">
							{section.gifts.length} 件（うち香典 {koden.length} 件・合計 {formatYen(kodenTotal)}）
						</p>
					</section>
				);
			})}
		</PrintLayout>
	);
};

// ---- 香典返し一覧 -----------------------------------------------------------------

export const PrintReturnsPage: FC<{
	kouden: KoudenContext;
	rows: ReturnRow[];
	filterLabel?: string | undefined;
	printedAt: Date;
}> = ({ kouden, rows, filterLabel, printedAt }) => {
	const linesTotal = rows.reduce((sum, r) => sum + (r.ret?.linesTotal ?? 0), 0);
	return (
		<PrintLayout kouden={kouden} title="香典返し一覧" subtitle={filterLabel} printedAt={printedAt}>
			{rows.length === 0 ? (
				<Empty>該当する差出人はいません。</Empty>
			) : (
				<section class="space-y-2">
					<table class="print-table">
						<thead>
							<tr>
								<th class="w-[2.5em] text-right">No.</th>
								<th>差出人</th>
								<th class="w-[7em] text-right">いただいた額</th>
								<th class="w-[6.5em]">状況</th>
								<th>品</th>
								<th class="w-[6.5em] text-right">金額</th>
								<th class="w-[7.5em]">手配・発送</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ person, ret }, i) => (
								<tr>
									<td class="text-right tabular-nums">{i + 1}</td>
									<td>
										{personLabel(person)}
										{(ret?.shipAddress ?? person.address) && (
											<span class="block text-[8.5pt]">{ret?.shipAddress ?? person.address}</span>
										)}
									</td>
									<td class="text-right tabular-nums">{formatYen(person.kodenTotal)}</td>
									<td>{ret ? RETURN_STATUSES[ret.status] : "未作成"}</td>
									<td>{ret ? linesLabel(ret) : ""}</td>
									<td class="text-right tabular-nums">
										{ret && ret.lines.length > 0 ? formatYen(ret.linesTotal) : ""}
										{ret && ret.onDayAmount > 0 && (
											<span class="block text-[8.5pt]">当日 {formatYen(ret.onDayAmount)}</span>
										)}
									</td>
									<td class="text-[9pt]">
										{ret?.arrangedAt && <span class="block">手配 {shortDate(ret.arrangedAt)}</span>}
										{ret?.shippedAt && <span class="block">発送 {shortDate(ret.shippedAt)}</span>}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<p class="text-right text-sm">
						{rows.length} 人・品の合計 {formatYen(linesTotal)}
					</p>
				</section>
			)}
		</PrintLayout>
	);
};

/** YYYY-MM-DD → 「2026/11/20」（表の幅を取らない書き方） */
const shortDate = (ymd: string) => ymd.replaceAll("-", "/");

// ---- 宛名一覧 -------------------------------------------------------------------

/** 宛名（個人は「様」、団体だけなら「御中」） */
export function addressee(row: Pick<AddressRow, "name" | "organization" | "position">): {
	lead: string | null;
	name: string;
} {
	if (row.name) {
		const lead = [row.organization, row.position].filter(Boolean).join(" ");
		return { lead: lead || null, name: `${row.name} 様` };
	}
	return { lead: null, name: `${row.organization ?? ""} 御中` };
}

export const PrintAddressesPage: FC<{
	kouden: KoudenContext;
	rows: AddressRow[];
	withoutAddress: number;
	shippingOnly: boolean;
	printedAt: Date;
}> = ({ kouden, rows, withoutAddress, shippingOnly, printedAt }) => (
	<PrintLayout
		kouden={kouden}
		title="宛名一覧"
		subtitle={shippingOnly ? "香典返しを配送する方" : undefined}
		printedAt={printedAt}
	>
		{withoutAddress > 0 && (
			<p class="text-sm print:hidden">
				住所が入っていない差出人が {withoutAddress} 人います（一覧には出ません）。
			</p>
		)}
		{rows.length === 0 ? (
			<Empty>住所が入っている差出人はいません。</Empty>
		) : (
			<table class="print-table">
				<thead>
					<tr>
						<th class="w-[2.5em] text-right">No.</th>
						<th class="w-[7em]">郵便番号</th>
						<th>ご住所</th>
						<th class="w-[16em]">お名前</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => {
						const { lead, name } = addressee(row);
						return (
							<tr>
								<td class="text-right tabular-nums">{i + 1}</td>
								<td class="whitespace-nowrap tabular-nums">
									{row.postalCode ? `〒${row.postalCode}` : ""}
								</td>
								<td>{row.address}</td>
								<td>
									{lead && <span class="block text-[8.5pt]">{lead}</span>}
									{name}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		)}
	</PrintLayout>
);
