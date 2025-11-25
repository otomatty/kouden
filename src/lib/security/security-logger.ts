/**
 * セキュリティログ機能
 * 全てのセキュリティ関連イベントをログに記録
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import logger from "@/lib/logger";

export type SecurityEventType =
	| "admin_login_success"
	| "admin_login_failure"
	| "admin_logout"
	| "admin_2fa_setup"
	| "admin_2fa_verified"
	| "admin_2fa_failed"
	| "admin_password_change"
	| "admin_account_locked"
	| "admin_account_unlocked"
	| "ip_blocked"
	| "ip_allowed"
	| "rate_limit_exceeded"
	| "file_upload_blocked"
	| "suspicious_activity_detected"
	| "sql_injection_attempt"
	| "xss_attempt"
	| "unauthorized_access_attempt"
	| "data_export"
	| "sensitive_data_access";

export type SecuritySeverity = "info" | "warning" | "error" | "critical";

export interface SecurityLogEntry {
	eventType: SecurityEventType;
	userId?: string;
	ipAddress?: string;
	userAgent?: string;
	requestPath?: string;
	details?: Record<string, unknown>;
	severity?: SecuritySeverity;
}

/**
 * セキュリティイベントをログに記録
 */
export async function logSecurityEvent(
	entry: SecurityLogEntry,
	request?: NextRequest,
): Promise<void> {
	try {
		const supabase = createAdminClient();

		// リクエストから情報を自動取得
		const ipAddress = entry.ipAddress || (request ? getClientIP(request) : null);
		const userAgent = entry.userAgent || request?.headers.get("user-agent");
		const requestPath = entry.requestPath || request?.nextUrl.pathname;

		await supabase.rpc("log_security_event", {
			p_event_type: entry.eventType,
			p_user_id: entry.userId || undefined,
			p_ip_address: ipAddress || undefined,
			p_user_agent: userAgent || undefined,
			p_request_path: requestPath || undefined,
			p_details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
			p_severity: entry.severity || "info",
		});

		// 重要度が高い場合は即座にアラート（将来的にSlack/Discord通知等）
		if (entry.severity === "critical" || entry.severity === "error") {
			logger.error(
				{
					eventType: entry.eventType,
					userId: entry.userId,
					ipAddress,
					details: entry.details,
					severity: entry.severity,
				},
				`[SECURITY ALERT] ${entry.eventType}`,
			);

			// 即座に管理者に通知する場合（実装例）
			await notifyAdmins(entry, ipAddress);
		}
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				eventType: entry.eventType,
			},
			"Failed to log security event",
		);
		// セキュリティログの記録失敗は致命的なので、フォールバック処理
		logger.error(
			{
				eventType: entry.eventType,
				entry,
			},
			`[SECURITY LOG FAILURE] ${entry.eventType}`,
		);
	}
}

/**
 * 管理者ログイン成功をログ
 */
export async function logAdminLogin(
	userId: string,
	request: NextRequest,
	withTwoFactor = false,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "admin_login_success",
			userId,
			severity: "info",
			details: {
				two_factor_used: withTwoFactor,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * 管理者ログイン失敗をログ
 */
export async function logAdminLoginFailure(
	userId: string | undefined,
	request: NextRequest,
	reason: string,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "admin_login_failure",
			userId,
			severity: "warning",
			details: {
				failure_reason: reason,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * 2FA関連イベントをログ
 */
export async function logTwoFactorEvent(
	eventType: "admin_2fa_setup" | "admin_2fa_verified" | "admin_2fa_failed",
	userId: string,
	request: NextRequest,
	details?: Record<string, unknown>,
): Promise<void> {
	const severity: SecuritySeverity = eventType === "admin_2fa_failed" ? "warning" : "info";

	await logSecurityEvent(
		{
			eventType,
			userId,
			severity,
			details: {
				...details,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * 2FA関連イベントをログ（Server Action専用）
 * NextRequestが利用できないServer Actionで使用
 */
export async function logTwoFactorEventServerAction(
	eventType: "admin_2fa_setup" | "admin_2fa_verified" | "admin_2fa_failed",
	userId: string,
	details?: Record<string, unknown>,
): Promise<void> {
	const severity: SecuritySeverity = eventType === "admin_2fa_failed" ? "warning" : "info";

	await logSecurityEvent(
		{
			eventType,
			userId,
			severity,
			details: {
				...details,
				timestamp: new Date().toISOString(),
			},
		},
		undefined, // Server ActionではNextRequestが取得できない
	);
}

/**
 * 怪しいアクティビティを検出・ログ
 */
export async function logSuspiciousActivity(
	userId: string | undefined,
	request: NextRequest,
	activityType: string,
	details: Record<string, unknown>,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "suspicious_activity_detected",
			userId,
			severity: "error",
			details: {
				activity_type: activityType,
				...details,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * ファイルアップロード攻撃をログ
 */
export async function logFileUploadBlocked(
	userId: string | undefined,
	request: NextRequest,
	fileName: string,
	reason: string,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "file_upload_blocked",
			userId,
			severity: "warning",
			details: {
				file_name: fileName,
				block_reason: reason,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * SQL インジェクション試行をログ
 */
export async function logSqlInjectionAttempt(
	userId: string | undefined,
	request: NextRequest,
	queryString: string,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "sql_injection_attempt",
			userId,
			severity: "critical",
			details: {
				attempted_query: queryString.substring(0, 500), // 最初の500文字のみ記録
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * XSS 攻撃試行をログ
 */
export async function logXssAttempt(
	userId: string | undefined,
	request: NextRequest,
	payload: string,
): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "xss_attempt",
			userId,
			severity: "critical",
			details: {
				attempted_payload: payload.substring(0, 500), // 最初の500文字のみ記録
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * レート制限超過をログ
 */
export async function logRateLimitExceeded(request: NextRequest, endpoint: string): Promise<void> {
	await logSecurityEvent(
		{
			eventType: "rate_limit_exceeded",
			severity: "warning",
			details: {
				endpoint,
				timestamp: new Date().toISOString(),
			},
		},
		request,
	);
}

/**
 * 管理者への即座通知（Slack/Discord等への拡張可能）
 */
async function notifyAdmins(entry: SecurityLogEntry, ipAddress: string | null): Promise<void> {
	// 実装例：Slack通知
	if (process.env.SLACK_WEBHOOK_URL) {
		try {
			const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: `🚨 セキュリティアラート: ${entry.eventType}`,
					attachments: [
						{
							color: entry.severity === "critical" ? "danger" : "warning",
							fields: [
								{ title: "イベント", value: entry.eventType, short: true },
								{ title: "ユーザーID", value: entry.userId || "Unknown", short: true },
								{ title: "IPアドレス", value: ipAddress || "Unknown", short: true },
								{ title: "詳細", value: JSON.stringify(entry.details), short: false },
							],
						},
					],
				}),
			});

			if (!response.ok) {
				logger.error({}, "Failed to send Slack notification");
			}
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
				},
				"Error sending Slack notification",
			);
		}
	}
}

/**
 * リクエストからクライアントIPアドレスを取得
 */
function getClientIP(request: NextRequest): string | null {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || null;
	}

	const cfConnectingIP = request.headers.get("cf-connecting-ip");
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	const xRealIP = request.headers.get("x-real-ip");
	if (xRealIP) {
		return xRealIP;
	}

	return null;
}
