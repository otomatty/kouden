import {
	can,
	formatYen,
	personLabel,
	RETURN_STATUSES,
	type ReturnStatus,
	type ReturnSuggestion,
} from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type {
	Caller,
	PersonView,
	ReturnBoardRow,
	ReturnsBoard,
	ReturnView,
} from "../../ledger/types.ts";
import { Hidden } from "../components/form.tsx";
import { formatDate, yen } from "../format.ts";
import { ui } from "../ui.ts";
import { LiveRegion } from "./shell.tsx";

/** 一覧の絞り込み: すべて / 未作成 / 状況 */
export type ReturnFilter = "all" | "none" | ReturnStatus;

export const RETURN_FILTERS: readonly { value: ReturnFilter; label: string }[] = [
	{ value: "all", label: "すべて" },
	{ value: "none", label: "未作成" },
	...Object.entries(RETURN_STATUSES).map(([value, label]) => ({
		value: value as ReturnStatus,
		label,
	})),
];

export function parseReturnFilter(v: string | undefined): ReturnFilter {
	return RETURN_FILTERS.find((f) => f.value === v)?.value ?? "all";
}

export interface ProposalRow {
	person: PersonView;
	suggestion: ReturnSuggestion;
}

const STATUS_BADGE: Record<ReturnStatus, string> = {
	pending: "bg-danger/10 text-danger",
	arranged: "bg-accent/10 text-accent-strong",
	shipped: "bg-paper text-ink",
	handed_on_day: "bg-paper text-ink",
	not_required: "bg-paper text-muted",
};

export const StatusBadge: FC<{ status: ReturnStatus }> = ({ status }) => (
	<span class={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[status]}`}>
		{RETURN_STATUSES[status]}
	</span>
);

const linesSummary = (ret: ReturnView) =>
	ret.lines.length === 0
		? "—"
		: ret.lines.map((l) => (l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name)).join("、");

/** 香典返し（E6-3, E6-4）: 一括提案と状況の一覧 */
export const ReturnsPage: FC<{
	kouden: KoudenContext;
	caller: Caller;
	board: ReturnsBoard;
	proposals: ProposalRow[];
	filter: ReturnFilter;
	onDay: number;
	notice?: string | undefined;
	error?: string | undefined;
}> = (props) => (
	<div class="space-y-6">
		{props.error && (
			<p role="alert" class={ui.alert}>
				{props.error}
			</p>
		)}
		{props.notice && (
			<p role="status" class={ui.notice}>
				{props.notice}
			</p>
		)}
		<ReturnsBoardRegion {...props} />
	</div>
);

/** 他の人の変更で取り直す部分（提案と一覧） */
export const ReturnsBoardRegion: FC<{
	kouden: KoudenContext;
	caller: Caller;
	board: ReturnsBoard;
	proposals: ProposalRow[];
	filter: ReturnFilter;
	onDay: number;
}> = ({ kouden, caller, board, proposals, filter, onDay }) => {
	const base = `/k/${kouden.id}`;
	const canWrite = can(caller.role, "ledger.write");
	const query = new URLSearchParams({ partial: "board", status: filter });
	if (onDay > 0) query.set("onDay", String(onDay));
	return (
		<LiveRegion
			id="returns-board"
			entities={["gift", "person", "event", "return", "return_item", "return_rule"]}
			url={`${base}/returns?${query.toString()}`}
			class="space-y-6"
		>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-sm">
					{board.dueDate ? (
						<>
							期限: <strong>{formatDate(board.dueDate)}</strong>（{board.dueEventName}）
						</>
					) : (
						<span class="text-muted">
							設定の「行事」で四十九日に日付を入れると、期限とお知らせメールの日程が決まります。
						</span>
					)}
				</p>
				<a href={`${base}/returns/settings`} class={ui.buttonSecondary}>
					カタログ・金額帯ルール
				</a>
			</div>
			{canWrite && proposals.length > 0 && (
				<Proposals kouden={kouden} board={board} proposals={proposals} onDay={onDay} />
			)}
			<StatusList kouden={kouden} caller={caller} board={board} filter={filter} />
		</LiveRegion>
	);
};

const Proposals: FC<{
	kouden: KoudenContext;
	board: ReturnsBoard;
	proposals: ProposalRow[];
	onDay: number;
}> = ({ kouden, board, proposals, onDay }) => {
	const base = `/k/${kouden.id}`;
	const activeItems = board.items.filter((i) => i.isActive);
	return (
		<section aria-labelledby="proposal" class={`${ui.card} space-y-4`}>
			<div class="space-y-1">
				<h2 id="proposal" class={ui.h2}>
					一括提案（{proposals.length} 人）
				</h2>
				<p class="text-sm text-muted">
					香典返しをまだ作っていない方に、金額帯ルール（なければ半返し）とカタログから品を提案します。品を確認・変更して確定してください。
				</p>
			</div>
			<form method="get" action={`${base}/returns`} class="flex flex-wrap items-end gap-2">
				<Hidden name="status" value="all" />
				<div class="space-y-1">
					<label for="f-onDay" class={ui.label}>
						当日返しで渡した額（全員共通）
					</label>
					<input
						id="f-onDay"
						name="onDay"
						inputmode="numeric"
						value={onDay > 0 ? String(onDay) : ""}
						placeholder="0"
						class={`${ui.input} w-40`}
					/>
				</div>
				<button type="submit" class={ui.buttonSecondary}>
					差し引いて計算し直す
				</button>
			</form>
			{activeItems.length === 0 && (
				<p class={ui.notice}>
					カタログに品がないため、品を提案できません。{" "}
					<a href={`${base}/returns/settings`} class={ui.link}>
						カタログに登録する
					</a>
				</p>
			)}
			<form method="post" action={`${base}/returns/confirm`} class="space-y-4">
				<Hidden name="onDay" value={onDay} />
				<div class="overflow-x-auto">
					<table class={ui.table}>
						<thead>
							<tr>
								<th class={ui.th} scope="col">
									<span class="sr-only">確定する</span>
								</th>
								<th class={ui.th} scope="col">
									差出人
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									いただいた額
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									目安
								</th>
								<th class={ui.th} scope="col">
									品
								</th>
							</tr>
						</thead>
						<tbody>
							{proposals.map(({ person, suggestion }) => {
								const label = personLabel(person);
								return (
									<tr>
										<td class={ui.td}>
											<input
												type="checkbox"
												name="persons"
												value={person.id}
												checked
												aria-label={`${label}の香典返しを確定する`}
												class="size-4 accent-accent"
											/>
										</td>
										<td class={ui.td}>
											<a href={`${base}/persons/${person.id}`} class={ui.link}>
												{label}
											</a>
										</td>
										<td class={`${ui.td} text-right tabular-nums`}>
											{formatYen(person.kodenTotal)}
										</td>
										<td class={`${ui.td} text-right tabular-nums`}>
											{formatYen(suggestion.target)}
											<span class="block text-xs text-muted">
												{suggestion.ratioNumerator}/{suggestion.ratioDenominator}
												{onDay > 0 && ` − 当日 ${formatYen(onDay)}`}
											</span>
										</td>
										<td class={ui.td}>
											<label for={`item-${person.id}`} class="sr-only">
												{label}の品
											</label>
											<select id={`item-${person.id}`} name={`item_${person.id}`} class={ui.input}>
												<option value="" selected={suggestion.item === null}>
													{onDay > 0 && suggestion.target === 0
														? "品なし（当日返しで済み）"
														: "品なし（後で決める）"}
												</option>
												{activeItems.map((i) => (
													<option value={i.id} selected={i.id === suggestion.item?.id}>
														{i.name}（{formatYen(i.price)}）
													</option>
												))}
											</select>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<button type="submit" class={ui.buttonPrimary}>
					選んだ方の香典返しを確定する
				</button>
			</form>
		</section>
	);
};

const StatusList: FC<{
	kouden: KoudenContext;
	caller: Caller;
	board: ReturnsBoard;
	filter: ReturnFilter;
}> = ({ kouden, caller, board, filter }) => {
	const base = `/k/${kouden.id}`;
	const canWrite = can(caller.role, "ledger.write");
	const count = (f: ReturnFilter) =>
		f === "all"
			? board.rows.length
			: f === "none"
				? board.rows.filter((r) => !r.ret).length
				: board.rows.filter((r) => r.ret?.status === f).length;
	const rows = board.rows.filter(
		(r: ReturnBoardRow) =>
			filter === "all" || (filter === "none" ? !r.ret : r.ret?.status === filter),
	);
	return (
		<section aria-labelledby="status-list" class={`${ui.card} space-y-4`}>
			<h2 id="status-list" class={ui.h2}>
				対応状況
			</h2>
			<nav aria-label="状況で絞り込む">
				<ul class="flex flex-wrap gap-2 text-sm">
					{RETURN_FILTERS.map((f) => (
						<li>
							<a
								href={`${base}/returns?status=${f.value}`}
								aria-current={f.value === filter ? "page" : undefined}
								class={`inline-block rounded-full border px-3 py-1 ${
									f.value === filter
										? "border-accent bg-accent/10 font-medium"
										: "border-line hover:bg-paper"
								}`}
							>
								{f.label} <span class="tabular-nums text-muted">{count(f.value)}</span>
							</a>
						</li>
					))}
				</ul>
			</nav>
			{rows.length === 0 ? (
				<p class="text-sm text-muted">該当する差出人はいません。</p>
			) : (
				<div class="overflow-x-auto">
					<table class={ui.table}>
						<thead>
							<tr>
								<th class={ui.th} scope="col">
									差出人
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									いただいた額
								</th>
								<th class={ui.th} scope="col">
									状況
								</th>
								<th class={ui.th} scope="col">
									品
								</th>
								<th class={`${ui.th} text-right`} scope="col">
									金額
								</th>
								<th class={ui.th} scope="col">
									<span class="sr-only">操作</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ person, ret }) => (
								<tr>
									<td class={ui.td}>
										<a href={`${base}/persons/${person.id}`} class={ui.link}>
											{personLabel(person)}
										</a>
										{person.address && (
											<span class="block text-xs text-muted">{person.address}</span>
										)}
									</td>
									<td class={`${ui.td} text-right tabular-nums`}>{yen(person.kodenTotal)}</td>
									<td class={ui.td}>
										{ret ? (
											<StatusBadge status={ret.status} />
										) : (
											<span class="text-muted">未作成</span>
										)}
										{ret?.shippedAt && (
											<span class="block text-xs text-muted">発送 {formatDate(ret.shippedAt)}</span>
										)}
										{!ret?.shippedAt && ret?.arrangedAt && (
											<span class="block text-xs text-muted">
												手配 {formatDate(ret.arrangedAt)}
											</span>
										)}
									</td>
									<td class={ui.td}>{ret ? linesSummary(ret) : ""}</td>
									<td class={`${ui.td} text-right tabular-nums`}>
										{ret && ret.lines.length > 0 ? formatYen(ret.linesTotal) : ""}
									</td>
									<td class={`${ui.td} text-right`}>
										{ret ? (
											<a href={`${base}/returns/${ret.id}`} class={ui.buttonSmall}>
												{canWrite ? "編集" : "詳細"}
											</a>
										) : (
											canWrite && (
												<form method="post" action={`${base}/persons/${person.id}/return`}>
													<button type="submit" class={ui.buttonSmall}>
														作成
													</button>
												</form>
											)
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
