/**
 * 認証フロー等で「次にリダイレクトする先」をユーザー入力から受け取るときの
 * オープンリダイレクト対策ヘルパー。
 *
 * 受理する値:
 *   - "/" で始まる相対パス（"/koudens/123" など）
 * 拒否する値:
 *   - スキーム付き絶対URL（"https://evil.com" など）
 *   - プロトコル相対URL（"//evil.com"）
 *   - バックスラッシュで始まるパス（"\\evil.com" — ブラウザで "//evil.com" と解釈されうる）
 *   - 空文字 / 不正な文字列 / null / undefined
 *
 * 戻り値: そのまま `Response.redirect(new URL(value, origin))` に渡せる安全な相対パス、または `null`。
 *
 * 検証ロジックは Cookie を書き込む側（API ルート）と読み出して redirect する側
 * （/auth/callback）の両方で完全に一致している必要がある。書き込み側が緩いと
 * 攻撃者がローカル Cookie を仕込んで読み出し側の信頼を悪用できるため、本関数を
 * 単一のソースとして使うこと。
 */
export function sanitizeRedirectPath(value: string | null | undefined): string | null {
	if (!value) return null;
	if (value.startsWith("//") || value.startsWith("\\")) return null;
	if (!value.startsWith("/")) return null;
	try {
		// base URL を使えば相対パスでも URL としてパースできる。
		// origin が変わった (= 絶対URLが指定されていた) ら拒否する。
		const base = "https://internal.invalid";
		const parsed = new URL(value, base);
		if (parsed.origin !== base) return null;
		return parsed.pathname + parsed.search + parsed.hash;
	} catch {
		return null;
	}
}
