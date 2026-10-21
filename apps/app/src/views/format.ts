import { formatYen } from "@kouden/domain";

const dateTime = new Intl.DateTimeFormat("ja-JP", {
	timeZone: "Asia/Tokyo",
	month: "numeric",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const fullDate = new Intl.DateTimeFormat("ja-JP", {
	timeZone: "Asia/Tokyo",
	year: "numeric",
	month: "long",
	day: "numeric",
});

/** ISO 日時 → 「10/12 14:05」（日本時間） */
export function formatDateTime(iso: string): string {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : dateTime.format(d);
}

/** YYYY-MM-DD → 「2026年11月20日」 */
export function formatDate(ymd: string | null): string {
	if (!ymd) return "";
	const d = new Date(`${ymd}T00:00:00+09:00`);
	return Number.isNaN(d.getTime()) ? ymd : fullDate.format(d);
}

/** ISO 日時 → 日本時間の日付（YYYY-MM-DD） */
export function jstDateOf(iso: string): string {
	const t = new Date(iso).getTime();
	return Number.isNaN(t) ? "" : new Date(t + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 金額。null は「—」 */
export function yen(amount: number | null): string {
	return amount === null ? "—" : formatYen(amount);
}
