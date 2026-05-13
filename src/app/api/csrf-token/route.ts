/**
 * CSRFトークン配布API
 * フロントエンドからCSRFトークンを取得するためのエンドポイント
 */

import logger from "@/lib/logger";

/**
 * 起動時に `CSRF_SECRET` 環境変数を検証して返す。
 *
 * - 必須環境変数。未設定または32文字未満の場合はエラーをスローし、
 *   サーバー起動を停止する（フェイルクローズド）。
 * - 推奨生成方法: `openssl rand -hex 32`
 *
 * @throws {Error} `CSRF_SECRET` 未設定 / 32文字未満のとき
 * @returns 検証済みのCSRF秘密鍵
 */
function getCSRFSecret(): string {
	const secret = process.env.CSRF_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error(
			"CSRF_SECRET environment variable is not set or too short (require >= 32 chars). " +
				"Generate one with: openssl rand -hex 32",
		);
	}
	return secret;
}

const CSRF_SECRET = getCSRFSecret();

/**
 * Web Crypto APIを使ってSHA-256ハッシュを生成
 */
async function createSha256Hash(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * ランダムなトークンを生成（Web Crypto API使用）
 */
function generateRandomToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRFトークンを生成（サーバーサイド専用）
 */
async function generateCSRFToken(): Promise<string> {
	const token = generateRandomToken();
	const timestamp = Date.now().toString();
	const signature = await createSha256Hash(`${token}:${timestamp}:${CSRF_SECRET}`);

	return `${token}:${timestamp}:${signature}`;
}

export async function GET() {
	try {
		const token = await generateCSRFToken();

		// Cookieに設定（HttpOnly有効。クライアントはJSONレスポンスから取得し、X-CSRF-Tokenヘッダーで送信する）
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
