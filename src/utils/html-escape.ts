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
 *
 * 開発環境 (`NODE_ENV === "development"`) では `http://localhost` も許可する。
 * これは preview-email ページや batch-invitations のローカルテスト用フォールバックを
 * 動作させるためで、本番環境では https のみを許可する。
 */
export function sanitizeHttpsUrl(url: string): string {
	const isHttps = url.startsWith("https://");
	const isDevLocalhost =
		process.env.NODE_ENV === "development" && url.startsWith("http://localhost");
	const safe = isHttps || isDevLocalhost ? url : "#";
	return escapeHtml(safe);
}
