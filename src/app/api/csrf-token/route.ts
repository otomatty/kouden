/**
 * CSRFトークン配布API
 * フロントエンドからCSRFトークンを取得するためのエンドポイント
 */

import { generateCSRFToken } from "@/lib/security/csrf-protection";
import logger from "@/lib/logger";

export async function GET() {
	try {
		const token = await generateCSRFToken();

		// JSONレスポンス: クライアントはここからトークンを取得し、X-CSRF-Token ヘッダーで送信する。
		// Cache-Control: no-store でブラウザ・中間キャッシュからのトークン再利用を防止。
		const response = new Response(
			JSON.stringify({
				csrfToken: token,
				message: "CSRF token generated successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		// CSRFトークンをCookieに設定（Double-submit Cookieパターンで使用）
		// HttpOnly: JSからの読み取り防止。クライアントはJSONレスポンスから取得済み。
		const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
		response.headers.set(
			"Set-Cookie",
			`csrf-token=${token}; Path=/; HttpOnly; SameSite=Strict;${secureFlag} Max-Age=3600`,
		);

		return response;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Error generating CSRF token",
		);
		return new Response("Internal Server Error", { status: 500 });
	}
}
