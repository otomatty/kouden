import {
	ATTENDANCES,
	GIFT_KINDS,
	personLabel,
	RETURN_METHODS,
	RETURN_STATUSES,
} from "@kouden/domain";
import writeXlsxFile, { type Cell, type Row, type Sheet } from "write-excel-file/universal";
import type { OutputData } from "../ledger/types.ts";
import { giftContributors, jointLabel, linesLabel, returnRows } from "./rows.ts";

/**
 * Excel（.xlsx）の出力（E7-3, 04 §8）。ライブラリは M4 の PoC で write-excel-file を選んだ
 * （Workers で動く・依存は fflate のみ・書式と列幅を指定できる）。
 * 文字列は文字列のセルとして書くので、「=」で始まる値も数式にはならない。
 */

export const XLSX_CONTENT_TYPE =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const YEN_FORMAT = "#,##0";
const DATE_FORMAT = "yyyy/mm/dd";
const DATE_TIME_FORMAT = "yyyy/mm/dd hh:mm";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const text = (value: string | null | undefined): Cell => (value ? { value, type: String } : null);
const int = (value: number | null | undefined): Cell =>
	value === null || value === undefined ? null : { value, type: Number };
const yen = (value: number | null | undefined): Cell =>
	value === null || value === undefined ? null : { value, type: Number, format: YEN_FORMAT };

/** YYYY-MM-DD → 日付のセル */
function date(ymd: string | null | undefined): Cell {
	if (!ymd) return null;
	const d = new Date(`${ymd}T00:00:00Z`);
	return Number.isNaN(d.getTime()) ? text(ymd) : { value: d, type: Date, format: DATE_FORMAT };
}

/** ISO 日時 → 日本時間の日時のセル（Excel の日時はタイムゾーンを持たないため、日本時間に直して書く） */
function dateTime(iso: string): Cell {
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return null;
	return { value: new Date(t + JST_OFFSET_MS), type: Date, format: DATE_TIME_FORMAT };
}

interface Column {
	header: string;
	width: number;
}

function sheet(name: string, columns: readonly Column[], rows: Row[]): Sheet<never> {
	return {
		sheet: name,
		columns: columns.map((c) => ({ width: c.width })),
		stickyRowsCount: 1,
		data: [
			columns.map((c) => ({
				value: c.header,
				type: String,
				fontWeight: "bold" as const,
				backgroundColor: "#EEEEEE",
			})),
			...rows,
		],
	};
}

export function workbookSheets(data: OutputData): Sheet<never>[] {
	const gifts = sheet(
		"いただきもの",
		[
			{ header: "行事", width: 12 },
			{ header: "番号", width: 9 },
			{ header: "種別", width: 8 },
			{ header: "差出人", width: 28 },
			{ header: "ふりがな", width: 18 },
			{ header: "関係", width: 10 },
			{ header: "連名", width: 28 },
			{ header: "金額", width: 11 },
			{ header: "品名", width: 18 },
			{ header: "数量", width: 6 },
			{ header: "参列", width: 10 },
			{ header: "メッセージ", width: 30 },
			{ header: "備考", width: 30 },
			{ header: "登録日時", width: 17 },
		],
		data.gifts.map((g) => {
			const { primary, others } = giftContributors(g);
			return [
				text(g.eventName),
				int(g.receiptNo),
				text(GIFT_KINDS[g.kind]),
				text(primary ? personLabel(primary) : null),
				text(primary?.nameKana),
				text(primary?.relationshipName),
				text(jointLabel(others)),
				yen(g.amount),
				text(g.itemName),
				int(g.quantity),
				text(g.attendance ? ATTENDANCES[g.attendance] : null),
				text(g.message),
				text(g.notes),
				dateTime(g.createdAt),
			];
		}),
	);

	const persons = sheet(
		"差出人",
		[
			{ header: "氏名", width: 16 },
			{ header: "ふりがな", width: 18 },
			{ header: "団体", width: 22 },
			{ header: "役職", width: 12 },
			{ header: "関係", width: 10 },
			{ header: "郵便番号", width: 10 },
			{ header: "住所", width: 40 },
			{ header: "電話", width: 14 },
			{ header: "いただきもの（件）", width: 10 },
			{ header: "香典（連名は按分）", width: 12 },
			{ header: "備考", width: 30 },
		],
		data.persons.map((p) => [
			text(p.name),
			text(p.nameKana),
			text(p.organization),
			text(p.position),
			text(p.relationshipName),
			text(p.postalCode),
			text(p.address),
			text(p.phone),
			int(p.giftCount),
			yen(p.kodenTotal),
			text(p.notes),
		]),
	);

	const returns = sheet(
		"香典返し",
		[
			{ header: "差出人", width: 28 },
			{ header: "いただいた香典", width: 12 },
			{ header: "状況", width: 12 },
			{ header: "渡し方", width: 10 },
			{ header: "品", width: 30 },
			{ header: "品の金額", width: 11 },
			{ header: "当日返しの額", width: 11 },
			{ header: "期限", width: 11 },
			{ header: "手配日", width: 11 },
			{ header: "発送日", width: 11 },
			{ header: "送付先の氏名", width: 16 },
			{ header: "送付先の郵便番号", width: 10 },
			{ header: "送付先の住所", width: 40 },
			{ header: "送付先の電話", width: 14 },
			{ header: "備考", width: 30 },
		],
		returnRows(data).map(({ person, ret }) => [
			text(personLabel(person)),
			yen(person.kodenTotal),
			text(ret ? RETURN_STATUSES[ret.status] : "未作成"),
			text(ret?.method ? RETURN_METHODS[ret.method] : null),
			text(ret ? linesLabel(ret) : null),
			yen(ret && ret.lines.length > 0 ? ret.linesTotal : null),
			yen(ret && ret.onDayAmount > 0 ? ret.onDayAmount : null),
			date(ret?.dueDate),
			date(ret?.arrangedAt),
			date(ret?.shippedAt),
			text(ret?.shipName),
			text(ret?.shipPostalCode),
			text(ret?.shipAddress),
			text(ret?.shipPhone),
			text(ret?.notes),
		]),
	);

	return [gifts, persons, returns];
}

export function buildWorkbook(data: OutputData): Promise<Blob> {
	return writeXlsxFile(workbookSheets(data), { fontFamily: "游ゴシック", fontSize: 11 }).toBlob();
}
