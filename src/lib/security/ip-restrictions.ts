/**
 * IP制限機能
 * 管理者画面へのアクセスを許可されたIPアドレスのみに制限
 */

import type { NextRequest } from "next/server";

// 許可されたIPアドレスのリスト（環境変数から取得）
const ALLOWED_ADMIN_IPS = process.env.ALLOWED_ADMIN_IPS?.split(",").map((ip) => ip.trim()) || [];

// 開発環境でのローカルIPアドレス（将来使用予定）
const _DEV_ALLOWED_IPS = ["127.0.0.1", "::1", "localhost"];

/**
 * IPアドレスが管理者アクセス許可リストに含まれているかチェック
 */
export function isAllowedAdminIP(request: NextRequest): boolean {
	// 開発環境では制限を緩和
	if (process.env.NODE_ENV === "development") {
		return true;
	}

	const clientIP = getClientIP(request);

	if (!clientIP) {
		console.warn("Could not determine client IP address");
		return false;
	}

	// 許可されたIPリストが設定されていない場合は拒否
	if (ALLOWED_ADMIN_IPS.length === 0) {
		console.error("ALLOWED_ADMIN_IPS environment variable not configured");
		return false;
	}

	const isAllowed = ALLOWED_ADMIN_IPS.includes(clientIP);

	if (!isAllowed) {
		console.warn(`Admin access denied for IP: ${clientIP}`);
	}

	return isAllowed;
}

/**
 * リクエストからクライアントIPアドレスを取得
 */
function getClientIP(request: NextRequest): string | null {
	// Vercelのヘッダーから取得
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || null;
	}

	// Cloudflareのヘッダーから取得
	const cfConnectingIP = request.headers.get("cf-connecting-ip");
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	// 通常のヘッダーから取得
	const xRealIP = request.headers.get("x-real-ip");
	if (xRealIP) {
		return xRealIP;
	}

	return null;
}

/**
 * ベーシック認証の実装
 */
export function verifyBasicAuth(request: NextRequest): boolean {
	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Basic ")) {
		return false;
	}

	const credentials = authHeader.slice(6);
	const decoded = Buffer.from(credentials, "base64").toString("utf-8");
	const [username, password] = decoded.split(":");

	const adminUsername = process.env.ADMIN_BASIC_USERNAME;
	const adminPassword = process.env.ADMIN_BASIC_PASSWORD;

	if (!(adminUsername && adminPassword)) {
		console.error("ADMIN_BASIC_USERNAME or ADMIN_BASIC_PASSWORD not configured");
		return false;
	}

	return username === adminUsername && password === adminPassword;
}
