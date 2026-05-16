/**
 * HTML エスケープユーティリティ。
 * 外部入力 (タイトル / メールアドレス / リンク等) を HTML 文書に補間する際に使用する。
 */
export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&#34;")
		.replace(/'/g, "&#39;");
}

/**
 * リンク用のサニタイズ。`https://` で始まるリンクのみ許可し、
 * それ以外 (`javascript:` / `data:` などのスキーム) は `#` にフォールバックして
 * HTML エスケープを掛けた値を返す。
 */
export function sanitizeHttpsUrl(url: string): string {
	const safe = url.startsWith("https://") ? url : "#";
	return escapeHtml(safe);
}
