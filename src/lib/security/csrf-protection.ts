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
import logger from "@/lib/logger";

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

	// 開発環境では緩和（デバッグ用、本番では絶対に有効化しないこと）
	if (process.env.NODE_ENV === "development" && process.env.CSRF_DEBUG === "true") {
		logger.error(
			{
				nodeEnv: process.env.NODE_ENV,
				pid: process.pid,
			},
			"[CSRF_DEBUG] CSRF protection is DISABLED. NEVER enable this in production.",
		);
		return true;
	}

	// Double-submit Cookie パターン: ヘッダーとCookieの両方が必須かつ値一致を要求
	const headerToken = request.headers.get("x-csrf-token");
	const cookieToken = request.cookies.get("csrf-token")?.value;

	if (!headerToken || !cookieToken) {
		logger.warn(
			{
				pathname: request.nextUrl.pathname,
				method: request.method,
				hasHeader: Boolean(headerToken),
				hasCookie: Boolean(cookieToken),
			},
			"CSRF token is missing (header or cookie)",
		);
		return false;
	}

	if (headerToken !== cookieToken) {
		logger.warn(
			{
				pathname: request.nextUrl.pathname,
				method: request.method,
			},
			"CSRF token mismatch between header and cookie",
		);
		return false;
	}

	const isValid = verifyCSRFToken(headerToken);
	if (!isValid) {
		logger.warn(
			{
				pathname: request.nextUrl.pathname,
				method: request.method,
			},
			"CSRF token validation failed",
		);
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
