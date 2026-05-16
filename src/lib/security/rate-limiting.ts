/**
 * レート制限機能
 * DDoS攻撃や不正なアクセスを防ぐため
 *
 * サーバーレス環境では Upstash Redis (REST) を使用してインスタンス間で
 * カウンタを共有する。`UPSTASH_REDIS_REST_URL` と `UPSTASH_REDIS_REST_TOKEN`
 * が未設定の場合は警告を出してインメモリ Map にフォールバックする
 * (開発用途のみ。サーバーレス本番では実質無効になる)。
 */

import logger from "@/lib/logger";
import { getClientIP } from "@/lib/security/client-ip";
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

// --- インメモリストア (フォールバック) ---

interface MemoryEntry {
	count: number;
	resetTime: number;
}

const memoryStore = new Map<string, MemoryEntry>();
let memoryStoreWarned = false;

function memoryCleanup(now: number): void {
	for (const [key, record] of memoryStore.entries()) {
		if (record.resetTime <= now) {
			memoryStore.delete(key);
		}
	}
}

function memoryIncrement(
	key: string,
	config: RateLimitConfig,
	now: number,
): { count: number; resetAt: number } {
	memoryCleanup(now);
	const current = memoryStore.get(key);
	if (!current || current.resetTime <= now) {
		const resetAt = now + config.windowMs;
		memoryStore.set(key, { count: 1, resetTime: resetAt });
		return { count: 1, resetAt };
	}
	current.count += 1;
	return { count: current.count, resetAt: current.resetTime };
}

// --- Upstash Redis ストア ---

interface UpstashConfig {
	url: string;
	token: string;
}

function readUpstashConfig(): UpstashConfig | null {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (!(url && token)) return null;
	return { url, token };
}

async function upstashPipeline(
	config: UpstashConfig,
	commands: Array<Array<string | number>>,
): Promise<unknown[]> {
	const response = await fetch(`${config.url}/pipeline`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(commands),
		// レート制限自体が落ちたら通過させたいので短いタイムアウトを期待
		cache: "no-store",
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Upstash request failed: ${response.status} ${text}`);
	}

	return (await response.json()) as unknown[];
}

async function upstashIncrement(
	config: UpstashConfig,
	key: string,
	windowMs: number,
	now: number,
): Promise<{ count: number; resetAt: number }> {
	// 原子的に INCR + 初回のみ PEXPIRE + PTTL を取得
	const results = await upstashPipeline(config, [
		["INCR", key],
		["PEXPIRE", key, windowMs, "NX"],
		["PTTL", key],
	]);

	const incrEntry = results[0] as { result?: number } | number | undefined;
	const ttlEntry = results[2] as { result?: number } | number | undefined;

	const count =
		typeof incrEntry === "number"
			? incrEntry
			: typeof incrEntry?.result === "number"
				? incrEntry.result
				: 0;
	const ttlMs =
		typeof ttlEntry === "number"
			? ttlEntry
			: typeof ttlEntry?.result === "number"
				? ttlEntry.result
				: -1;

	const resetAt = ttlMs > 0 ? now + ttlMs : now + windowMs;
	return { count, resetAt };
}

// --- 公開API ---

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
		logger.warn(
			{
				pathname: request.nextUrl.pathname,
			},
			"Could not determine client IP for rate limiting",
		);
		return { success: true };
	}

	// 管理者画面かどうかで設定を変更
	const isAdminPath =
		request.nextUrl.pathname.startsWith("/admin") ||
		request.nextUrl.pathname.startsWith("/(system)/admin");
	const rateLimitConfig = config || (isAdminPath ? adminConfig : defaultConfig);

	const bucket = isAdminPath ? "admin" : "general";
	const key = `ratelimit:${bucket}:${clientIP}`;
	const now = Date.now();

	const upstash = readUpstashConfig();
	let count: number;
	let resetAt: number;

	if (upstash) {
		try {
			const result = await upstashIncrement(upstash, key, rateLimitConfig.windowMs, now);
			count = result.count;
			resetAt = result.resetAt;
		} catch (error) {
			logger.error(
				{ err: error instanceof Error ? error.message : String(error), key },
				"Upstash rate limit failed, falling back to in-memory",
			);
			const result = memoryIncrement(key, rateLimitConfig, now);
			count = result.count;
			resetAt = result.resetAt;
		}
	} else {
		if (!memoryStoreWarned && process.env.NODE_ENV === "production") {
			memoryStoreWarned = true;
			logger.warn(
				{},
				"UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — rate limit uses in-memory Map and will NOT work across serverless instances",
			);
		}
		const result = memoryIncrement(key, rateLimitConfig, now);
		count = result.count;
		resetAt = result.resetAt;
	}

	if (count > rateLimitConfig.maxRequests) {
		return {
			success: false,
			remainingRequests: 0,
			resetTime: new Date(resetAt),
		};
	}

	return {
		success: true,
		remainingRequests: Math.max(0, rateLimitConfig.maxRequests - count),
		resetTime: new Date(resetAt),
	};
}

/**
 * 特定のIPアドレスのレート制限をリセット
 * (インメモリストアのみ対応。Upstash 利用時は TTL に任せる)
 */
export function resetRateLimit(ipAddress: string): void {
	const suffix = `:${ipAddress}`;
	const keys = Array.from(memoryStore.keys()).filter((key) => key.endsWith(suffix));
	for (const key of keys) {
		memoryStore.delete(key);
	}
}

/**
 * Vercel 環境でも `rateLimit` が Upstash を介して永続化されるため、
 * 互換のために残しているエイリアス。
 */
export async function vercelRateLimit(request: NextRequest): Promise<RateLimitResult> {
	return rateLimit(request);
}
