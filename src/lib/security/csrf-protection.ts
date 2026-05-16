/**
 * CSRF保護機能（Edge Runtime / Node.js 両対応）
 * Cross-Site Request Forgery攻撃を防止するためのトークン管理
 *
 * Web Crypto API（`globalThis.crypto`）を使用しているため、以下すべてで利用可能：
 * ✅ API routes (src/app/api/*)
 * ✅ Middleware (src/middleware.ts, Edge Runtime)
 * ✅ Server Actions (_actions/admin/*.ts)
 *
 * クライアントサイドからは絶対にインポートしないこと（CSRF_SECRETがバンドルに含まれてしまうため）。
 * クライアントではCSRF Providerとuse-csrf-tokenフックを使用すること。
 *
 * Double-submit Cookie パターン:
 *   - `csrf-token` Cookie と `X-CSRF-Token` ヘッダーの両方が必須かつ値一致を要求
 *   - クライアントは `/api/csrf-token` のJSONレスポンスからトークンを取得し、ヘッダーで送信
 *   - CookieはHttpOnlyで発行され、JavaScriptから読めない
 */

import { timingSafeEqual } from "@/lib/security/timing-safe";
import type { NextRequest } from "next/server";

/**
 * 起動時に `CSRF_SECRET` 環境変数を検証して返す。
 *
 * - 必須環境変数。未設定または32文字未満の場合はエラーをスローし、
 *   プロセス起動を停止する（フェイルクローズド）。
 * - 推奨生成方法: `openssl rand -hex 32`
 *
 * @throws {Error} `CSRF_SECRET` 未設定 / 32文字未満のとき
 * @returns 検証済みのCSRF秘密鍵
 */
export function getCSRFSecret(): string {
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
 * CSRFトークンの署名有効期間（ミリ秒）。
 * Cookie の `Max-Age` を残存TTLに合わせる用途でも使用する。
 */
export const CSRF_TOKEN_TTL_MS = 3600 * 1000;

/**
 * 指定トークンの残存TTL（ミリ秒）を返す。期限切れ・改ざんなど無効なら `null`。
 *
 * @param token 検証済みのCSRFトークン
 * @returns 残存TTL（ms）または `null`
 */
export function getCSRFTokenRemainingTTL(token: string): number | null {
	const parts = token.split(":");
	if (parts.length !== 3) {
		return null;
	}
	const tokenTime = Number.parseInt(parts[1] ?? "");
	if (Number.isNaN(tokenTime)) {
		return null;
	}
	const remaining = CSRF_TOKEN_TTL_MS - (Date.now() - tokenTime);
	return remaining > 0 ? remaining : null;
}

/**
 * Web Crypto APIでSHA-256ハッシュを生成し、16進文字列で返す。
 *
 * @param data ハッシュ化する文字列
 * @returns SHA-256ハッシュの16進表現（64文字）
 */
async function createSha256Hash(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * ランダムな32バイトトークンを16進で生成する（Web Crypto API使用）。
 *
 * @returns 64文字の16進ランダム文字列
 */
function generateRandomToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRFトークンを生成する。
 * フォーマット: `<random>:<timestamp>:<sha256-signature>`
 *
 * @returns 署名付きCSRFトークン
 */
export async function generateCSRFToken(): Promise<string> {
	const token = generateRandomToken();
	const timestamp = Date.now().toString();
	const signature = await createSha256Hash(`${token}:${timestamp}:${CSRF_SECRET}`);

	return `${token}:${timestamp}:${signature}`;
}

/**
 * CSRFトークンを検証する。
 * タイムスタンプ（1時間以内）と署名の整合性をチェック。
 *
 * @param token 検証するCSRFトークン
 * @returns トークンが有効かどうか
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
	try {
		const [tokenPart, timestamp, signature] = token.split(":");

		if (!(tokenPart && timestamp && signature)) {
			return false;
		}

		// タイムスタンプチェック（CSRF_TOKEN_TTL_MS 以内）
		const tokenTime = Number.parseInt(timestamp);
		const now = Date.now();
		if (now - tokenTime > CSRF_TOKEN_TTL_MS) {
			return false;
		}

		// 署名検証（タイミング攻撃を防ぐため定数時間比較）
		const expectedSignature = await createSha256Hash(`${tokenPart}:${timestamp}:${CSRF_SECRET}`);

		return timingSafeEqual(signature, expectedSignature);
	} catch {
		return false;
	}
}

/**
 * リクエストのCSRFトークンをチェックする（Double-submit Cookieパターン）。
 *
 * - 安全メソッド（GET / HEAD / OPTIONS）はスキップ
 * - 開発環境で `CSRF_DEBUG=true` のときはバイパス（本番禁止）
 * - ヘッダー `x-csrf-token` と Cookie `csrf-token` の両方が必須かつ値一致を要求
 *
 * @param request NextRequest オブジェクト
 * @returns CSRF検証結果
 */
export async function checkCSRFToken(request: NextRequest): Promise<boolean> {
	// 安全メソッド（副作用なし）はスキップ。HEAD/OPTIONS（preflight）も含める。
	if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
		return true;
	}

	// 開発環境では緩和（デバッグ用、本番では絶対に有効化しないこと）
	if (process.env.NODE_ENV === "development" && process.env.CSRF_DEBUG === "true") {
		console.error(
			`[CSRF_DEBUG] CSRF protection is DISABLED (NODE_ENV=${process.env.NODE_ENV}). NEVER enable this in production.`,
		);
		return true;
	}

	// Double-submit Cookie パターン: ヘッダーとCookieの両方が必須かつ値一致を要求
	const headerToken = request.headers.get("x-csrf-token");
	const cookieToken = request.cookies.get("csrf-token")?.value;

	if (!headerToken || !cookieToken) {
		console.warn(
			`CSRF token is missing (header or cookie). pathname=${request.nextUrl.pathname} method=${request.method}`,
		);
		return false;
	}

	if (headerToken !== cookieToken) {
		console.warn(
			`CSRF token mismatch between header and cookie. pathname=${request.nextUrl.pathname} method=${request.method}`,
		);
		return false;
	}

	const isValid = await verifyCSRFToken(headerToken);
	if (!isValid) {
		console.warn(
			`CSRF token validation failed. pathname=${request.nextUrl.pathname} method=${request.method}`,
		);
	}

	return isValid;
}

/**
 * CSRF保護が必要なパスかどうかを判定する。
 *
 * - `/api/*` はデフォルトで保護対象（一部例外あり）
 * - 例外: `/api/stripe/webhook`, `/api/health`, `/api/csrf-token`, `/api/csp-report`
 * - Server Actions は Next.js のビルトインCSRF保護に委ねるため対象外
 *
 * @param pathname リクエストパス
 * @returns CSRF保護が必要かどうか
 */
export function requiresCSRFProtection(pathname: string): boolean {
	if (pathname.startsWith("/api/")) {
		const exemptPaths = [
			"/api/stripe/webhook",
			"/api/health",
			"/api/csrf-token",
			"/api/csp-report",
		];
		// 完全一致または明示的なサブルート（`path + "/"`）のみを除外対象とする。
		// 単純な startsWith だと "/api/csrf-tokenize" のような prefix 一致パスまで
		// 誤って除外されてしまうため。
		return !exemptPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
	}

	// Server Actions は Next.js が自動でCSRF保護するため対象外
	return false;
}

/**
 * CSRF検証失敗時の 403 レスポンス。
 *
 * @returns 403 Forbiddenレスポンス
 */
export function createCSRFErrorResponse(): Response {
	return new Response("CSRF token validation failed", {
		status: 403,
		headers: {
			"Content-Type": "text/plain",
		},
	});
}
