import {
	ATTENDANCES,
	EVENT_KINDS,
	formatYen,
	GIFT_KINDS,
	RETURN_METHODS,
	RETURN_STATUSES,
	ROLES,
} from "@kouden/domain";
import type { FC } from "hono/jsx";
import { parseDiff } from "../../ledger/diff.ts";
import type { History } from "../../ledger/types.ts";
import { formatDateTime } from "../format.ts";
import { ui } from "@kouden/ui";

const FIELD_LABELS: Record<string, string> = {
	event_id: "行事",
	receipt_no: "番号",
	kind: "種別",
	amount: "金額",
	item_name: "品名",
	quantity: "数量",
	message: "弔電の文面",
	attendance: "参列",
	notes: "備考",
	contributors: "差出人",
	name: "氏名",
	name_kana: "ふりがな",
	organization: "団体名",
	position: "役職",
	relationship_id: "関係",
	postal_code: "郵便番号",
	address: "住所",
	phone: "電話番号",
	date: "日付",
	sort_order: "並び順",
	is_hidden: "非表示",
	role: "ロール",
	status: "状況",
	person_id: "差出人",
	method: "渡し方",
	on_day_amount: "当日返しの額",
	due_date: "期限",
	arranged_at: "手配日",
	shipped_at: "発送日",
	ship_name: "送付先の宛名",
	ship_postal_code: "送付先の郵便番号",
	ship_address: "送付先の住所",
	ship_phone: "送付先の電話番号",
};

const OP_LABELS: Record<string, string> = {
	create: "登録",
	update: "変更",
	delete: "削除",
	restore: "復元",
	merge: "統合",
	import: "移行",
};

const lookup = (table: Record<string, string>, v: unknown) =>
	typeof v === "string" ? (table[v] ?? v) : String(v);

function formatValue(key: string, value: unknown, names: Record<string, string>): string {
	if (value === null || value === undefined || value === "") return "（なし）";
	if (key === "kind") return lookup({ ...GIFT_KINDS, ...EVENT_KINDS }, value);
	if (key === "attendance") return lookup(ATTENDANCES, value);
	if (key === "role") return lookup(ROLES, value);
	if (key === "status") return lookup(RETURN_STATUSES, value);
	if (key === "method") return lookup(RETURN_METHODS, value);
	if ((key === "amount" || key === "on_day_amount") && typeof value === "number") {
		return formatYen(value);
	}
	if (key.startsWith("line:") && typeof value === "object") {
		const v = value as { name?: string; unitPrice?: number; quantity?: number };
		return `${v.name ?? ""} ${formatYen(v.unitPrice ?? 0)} × ${v.quantity ?? 1}`;
	}
	if (key === "event_id" || key === "relationship_id" || key === "person_id") {
		return typeof value === "string" ? (names[value] ?? "（削除済み）") : "";
	}
	if (key === "contributors") {
		return Array.isArray(value)
			? value.map((id) => names[String(id)] ?? "（不明）").join("、")
			: "";
	}
	if (key.startsWith("contributor:") && typeof value === "object") {
		const v = value as { shareAmount?: number | null; isPrimary?: boolean; makePrimary?: boolean };
		const share =
			typeof v.shareAmount === "number" ? `負担額 ${formatYen(v.shareAmount)}` : "負担額なし";
		return v.isPrimary || v.makePrimary ? `${share}・代表者` : share;
	}
	if (typeof value === "boolean") return value ? "はい" : "いいえ";
	return String(value);
}

function fieldLabel(key: string, names: Record<string, string>): string {
	if (key.startsWith("line:")) return "明細";
	if (key.startsWith("contributor:")) {
		return `差出人「${names[key.slice("contributor:".length)] ?? "不明"}」`;
	}
	return FIELD_LABELS[key] ?? key;
}

/** 記録ごとの変更履歴（E8-4）。新しい順 */
export const HistoryList: FC<{ history: History }> = ({ history }) => (
	<details class={`${ui.cardTight} text-sm`}>
		<summary class="cursor-pointer font-medium">変更履歴（{history.entries.length} 件）</summary>
		<ol class="mt-3 space-y-3">
			{history.entries.map((e) => {
				// 登録は登録時の内容（空の項目を除く）、変更は変更前後を表示する
				const changes =
					e.op === "update" || e.op === "create"
						? Object.entries(parseDiff(e.diff)).filter(
								([, [, after]]) => e.op === "update" || (after !== null && after !== ""),
							)
						: [];
				return (
					<li class="border-l-2 border-line pl-3">
						<p>
							<span class="tabular-nums text-muted">{formatDateTime(e.at)}</span>
							<span class="ml-2 font-medium">{e.actorName}</span>
							<span class="ml-2">{OP_LABELS[e.op] ?? e.op}</span>
						</p>
						{changes.length > 0 && (
							<ul class="mt-1 space-y-0.5 text-muted">
								{changes.map(([key, [before, after]]) => (
									<li>
										{fieldLabel(key, history.names)}:{" "}
										{/* 登録時の内容と、変更前が記録されていない連名の変更は「後」だけを出す */}
										{e.op === "create" || (key.startsWith("contributor:") && before === null) ? (
											formatValue(key, after, history.names)
										) : (
											<>
												{formatValue(key, before, history.names)} →{" "}
												{formatValue(key, after, history.names)}
											</>
										)}
									</li>
								))}
							</ul>
						)}
					</li>
				);
			})}
		</ol>
	</details>
);
