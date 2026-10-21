/** 現在時刻を ISO 8601 UTC 文字列で返す（DB に保存する日時の共通形式）。 */
export function nowIso(now: Date = new Date()): string {
	return now.toISOString();
}
