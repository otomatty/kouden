/**
 * CSRFトークン配布API
 * フロントエンドからCSRFトークンを取得するためのエンドポイント
 */

const CSRF_SECRET = process.env.CSRF_SECRET || "default-secret-change-in-production";

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

		// Cookieに設定（HttpOnly falseでJavaScriptからアクセス可能）
		const response = new Response(
			JSON.stringify({
				csrfToken: token,
				message: "CSRF token generated successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		// CSRFトークンをCookieに設定
		response.headers.set(
			"Set-Cookie",
			`csrf-token=${token}; Path=/; HttpOnly=false; SameSite=Strict; Secure=${
				process.env.NODE_ENV === "production"
			}; Max-Age=3600`,
		);

		return response;
	} catch (error) {
		console.error("Error generating CSRF token:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
