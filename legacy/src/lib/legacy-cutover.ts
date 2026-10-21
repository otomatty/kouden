import { type NextRequest, NextResponse } from "next/server";

const MAINTENANCE_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>メンテナンス中 | 香典帳</title>
</head>
<body style="font-family: sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.8;">
<h1>ただいまメンテナンス中です</h1>
<p>新しい香典帳への移行作業のため、一時的にご利用いただけません。作業が終わるまで今しばらくお待ちください。</p>
</body>
</html>`;

/**
 * v2 への切り替え用の停止と転送（手順は docs/rebuild/07-legacy-cutover.md）。
 * - LEGACY_REDIRECT_ORIGIN: 全パスをその origin の同じパスへ 301 で転送する
 * - MAINTENANCE_MODE=true: 画面・Server Actions・API（Stripe Webhook・Cron を含む）を 503 で止める。
 *   Stripe は 2xx 以外を再送するので、受け付けなかったイベントは失われない
 * どちらも未設定なら null を返し、通常の処理を続ける。
 */
export function legacyCutoverResponse(request: NextRequest): NextResponse | null {
	const redirectOrigin = process.env.LEGACY_REDIRECT_ORIGIN;
	if (redirectOrigin) {
		const { pathname, search } = request.nextUrl;
		// 切り戻しで転送を取り消せるよう、ブラウザに 301 を保存させない
		return NextResponse.redirect(new URL(pathname + search, redirectOrigin), {
			status: 301,
			headers: { "Cache-Control": "no-store" },
		});
	}

	if (process.env.MAINTENANCE_MODE !== "true") return null;

	const headers = { "Retry-After": "3600", "Cache-Control": "no-store" };
	if (request.nextUrl.pathname.startsWith("/api/")) {
		return NextResponse.json({ error: "maintenance" }, { status: 503, headers });
	}
	return new NextResponse(MAINTENANCE_HTML, {
		status: 503,
		headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
	});
}
