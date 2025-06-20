/**
 * CSRF保護機能（サーバーサイド専用）
 * Cross-Site Request Forgery攻撃を防止するためのトークン管理
 *
 * ⚠️ 【重要警告】: このファイルは絶対にクライアントサイドからインポートしないこと！
 * - API routes、Server Actions、Middlewareでのみ使用可能
 * - node:cryptoがブラウザで動作しないため、クライアントサイドでバンドルするとエラーになる
 * - クライアントサイドではCSRF Providerとuse-csrf-tokenフックを使用すること
 *
 * 使用可能場所：
 * ✅ src/app/api/*.ts (API routes)
 * ✅ src/middleware.ts
 * ✅ Server Actions (_actions/admin/*.ts)
 * ❌ コンポーネント、フック、クライアント側プロバイダー
 */

import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

const CSRF_SECRET = process.env.CSRF_SECRET || "default-secret-change-in-production";

/**
 * CSRFトークンを生成（サーバーサイド専用）
 * タイムスタンプと署名を含む安全なトークンを作成
 *
 * @returns 署名付きCSRFトークン
 * @serverOnly このファイルはサーバーサイドでのみ使用可能
 */
export function generateCSRFToken(): string {
	const token = randomBytes(32).toString("hex");
	const timestamp = Date.now().toString();
	const signature = createHash("sha256")
		.update(`${token}:${timestamp}:${CSRF_SECRET}`)
		.digest("hex");

	return `${token}:${timestamp}:${signature}`;
}

/**
 * CSRFトークンを検証（サーバーサイド専用）
 * タイムスタンプと署名の整合性をチェック
 *
 * @param token 検証するCSRFトークン
 * @returns トークンが有効かどうか
 * @serverOnly このファイルはサーバーサイドでのみ使用可能
 */
export function verifyCSRFToken(token: string): boolean {
	try {
		const [tokenPart, timestamp, signature] = token.split(":");

		if (!(tokenPart && timestamp && signature)) {
			return false;
		}

		// タイムスタンプチェック（1時間以内）
		const tokenTime = Number.parseInt(timestamp);
		const now = Date.now();
		if (now - tokenTime > 3600000) {
			// 1時間
			return false;
		}

		// 署名検証
		const expectedSignature = createHash("sha256")
			.update(`${tokenPart}:${timestamp}:${CSRF_SECRET}`)
			.digest("hex");

		return signature === expectedSignature;
	} catch {
		return false;
	}
}

/**
 * リクエストのCSRFトークンをチェック
 * GETリクエストはスキップし、POST等でトークンを検証
 *
 * @param request NextRequest オブジェクト
 * @returns CSRF検証結果
 * @serverOnly このファイルはサーバーサイドでのみ使用可能
 */
export function checkCSRFToken(request: NextRequest): boolean {
	// GETリクエストはスキップ
	if (request.method === "GET") {
		return true;
	}

	// 開発環境では緩和（デバッグ用）
	if (process.env.NODE_ENV === "development" && process.env.CSRF_DEBUG === "true") {
		console.warn("CSRF protection is disabled in development mode");
		return true;
	}

	// CSRFトークンを取得（ヘッダーまたはCookieから）
	const csrfToken = request.headers.get("x-csrf-token") || request.cookies.get("csrf-token")?.value;

	if (!csrfToken) {
		console.warn("CSRF token is missing");
		return false;
	}

	const isValid = verifyCSRFToken(csrfToken);
	if (!isValid) {
		console.warn("CSRF token validation failed");
	}

	return isValid;
}

/**
 * CSRF保護が必要なパスかどうかを判定
 *
 * @param pathname リクエストパス
 * @returns CSRF保護が必要かどうか
 * @serverOnly このファイルはサーバーサイドでのみ使用可能
 */
export function requiresCSRFProtection(pathname: string): boolean {
	// API routes
	if (pathname.startsWith("/api/")) {
		// CSRF保護が不要なAPI（webhook等）
		const exemptPaths = ["/api/stripe/webhook", "/api/health", "/api/csrf-token"];
		return !exemptPaths.some((path) => pathname.startsWith(path));
	}

	// Server Actions（POST/PUT/DELETE等）
	return true;
}

/**
 * CSRFエラーレスポンス用のヘルパー
 *
 * @returns 403 Forbiddenレスポンス
 * @serverOnly このファイルはサーバーサイドでのみ使用可能
 */
export function createCSRFErrorResponse(): Response {
	return new Response("CSRF token validation failed", {
		status: 403,
		headers: {
			"Content-Type": "text/plain",
		},
	});
}
