/**
 * IP制限機能
 * 管理者画面へのアクセスを許可されたIPアドレスのみに制限
 */

import logger from "@/lib/logger";
import { getClientIP } from "@/lib/security/client-ip";
import type { NextRequest } from "next/server";

// 許可されたIPアドレスのリスト（環境変数から取得）
const ALLOWED_ADMIN_IPS = process.env.ALLOWED_ADMIN_IPS?.split(",").map((ip) => ip.trim()) || [];

// 明示的な無効化フラグ。`NODE_ENV` 依存を排除するため独立した env で制御する。
// 本番でこれを有効化すると管理画面が無制限公開になるため、警告ログを出す。
function isAdminIPRestrictionDisabled(): boolean {
	return process.env.ADMIN_IP_RESTRICTION === "off";
}

/**
 * IPアドレスが管理者アクセス許可リストに含まれているかチェック
 */
export function isAllowedAdminIP(request: NextRequest): boolean {
	if (isAdminIPRestrictionDisabled()) {
		if (process.env.NODE_ENV === "production") {
			logger.warn(
				{},
				"ADMIN_IP_RESTRICTION=off in production — admin IP restriction is fully disabled",
			);
		}
		return true;
	}

	const clientIP = getClientIP(request);

	if (!clientIP) {
		logger.warn({}, "Could not determine client IP address");
		return false;
	}

	// 許可されたIPリストが設定されていない場合は拒否
	if (ALLOWED_ADMIN_IPS.length === 0) {
		logger.error({}, "ALLOWED_ADMIN_IPS environment variable not configured");
		return false;
	}

	const isAllowed = ALLOWED_ADMIN_IPS.includes(clientIP);

	if (!isAllowed) {
		logger.warn({ ipAddress: clientIP }, "Admin access denied for IP");
	}

	return isAllowed;
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
		logger.error({}, "ADMIN_BASIC_USERNAME or ADMIN_BASIC_PASSWORD not configured");
		return false;
	}

	return username === adminUsername && password === adminPassword;
}
