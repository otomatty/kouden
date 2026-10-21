/** 変更ログの差分（JSON 文字列）を読む */
export function parseDiff(diff: string | null): Record<string, [unknown, unknown]> {
	return diff ? (JSON.parse(diff) as Record<string, [unknown, unknown]>) : {};
}
