type Level = "info" | "warn" | "error";

/**
 * 1 行 1 JSON の構造化ログ。Workers Logs で検索しやすくする。
 * 差出人などの個人情報・クエリ文字列（OAuth の code 等）は渡さないこと。
 */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
	const line = JSON.stringify({ level, msg, ...fields });
	if (level === "error") console.error(line);
	else if (level === "warn") console.warn(line);
	// oxlint-disable-next-line no-console -- Workers Logs への出力そのものが目的
	else console.log(line);
}
