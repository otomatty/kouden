/**
 * レート制限機能
 * DDoS攻撃や不正なアクセスを防ぐため
 */

import type { NextRequest } from "next/server";

interface RateLimitConfig {
	windowMs: number; // 時間窓（ミリ秒）
	maxRequests: number; // 最大リクエスト数
}

interface RateLimitResult {
	success: boolean;
	remainingRequests?: number;
	resetTime?: Date;
}

// メモリベースのレート制限ストレージ（本番環境ではRedisを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// デフォルト設定
const defaultConfig: RateLimitConfig = {
	windowMs: 60 * 1000, // 1分
	maxRequests: 100, // 1分間に100リクエスト
};

// 管理者画面用の厳しい制限
const adminConfig: RateLimitConfig = {
	windowMs: 60 * 1000, // 1分
	maxRequests: 20, // 1分間に20リクエスト
};

/**
 * レート制限チェック
 */
export async function rateLimit(
	request: NextRequest,
	config?: RateLimitConfig,
): Promise<RateLimitResult> {
	const clientIP = getClientIP(request);
	if (!clientIP) {
		// IPが取得できない場合は通す（ログに記録）
		console.warn("Could not determine client IP for rate limiting");
		return { success: true };
	}

	// 管理者画面かどうかで設定を変更
	const isAdminPath =
		request.nextUrl.pathname.startsWith("/admin") ||
		request.nextUrl.pathname.startsWith("/(system)/admin");
	const rateLimitConfig = config || (isAdminPath ? adminConfig : defaultConfig);

	const key = `${clientIP}:${isAdminPath ? "admin" : "general"}`;
	const now = Date.now();
	const windowStart = now - rateLimitConfig.windowMs;

	// 古い記録をクリーンアップ
	cleanupOldRecords(windowStart);

	const current = rateLimitStore.get(key);

	if (!current || current.resetTime <= now) {
		// 新しい窓を開始
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + rateLimitConfig.windowMs,
		});
		return {
			success: true,
			remainingRequests: rateLimitConfig.maxRequests - 1,
			resetTime: new Date(now + rateLimitConfig.windowMs),
		};
	}

	if (current.count >= rateLimitConfig.maxRequests) {
		// 制限に達している
		return {
			success: false,
			remainingRequests: 0,
			resetTime: new Date(current.resetTime),
		};
	}

	// カウンターを増加
	current.count++;
	return {
		success: true,
		remainingRequests: rateLimitConfig.maxRequests - current.count,
		resetTime: new Date(current.resetTime),
	};
}

/**
 * 特定のIPアドレスのレート制限をリセット
 */
export function resetRateLimit(ipAddress: string): void {
	const keys = Array.from(rateLimitStore.keys()).filter((key) => key.startsWith(ipAddress));
	for (const key of keys) {
		rateLimitStore.delete(key);
	}
}

/**
 * 古いレート制限記録をクリーンアップ
 */
function cleanupOldRecords(windowStart: number): void {
	for (const [key, record] of rateLimitStore.entries()) {
		if (record.resetTime <= windowStart) {
			rateLimitStore.delete(key);
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

/**
 * Vercel環境でのレート制限（Edge Config使用）
 */
export async function vercelRateLimit(request: NextRequest): Promise<RateLimitResult> {
	// Vercel Edge Configを使用したレート制限
	// 本実装では @vercel/edge-config パッケージが必要

	// フォールバック：メモリベースのレート制限を使用
	return rateLimit(request);
}
