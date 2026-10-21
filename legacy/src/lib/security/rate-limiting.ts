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

// 期限切れエントリの一括掃除は O(N) のためリクエスト毎には行わず、
// 最後の掃除から `MEMORY_CLEANUP_INTERVAL_MS` 経過したときだけ走らせる。
// (個別エントリの期限は `memoryIncrement` のアクセス時にもチェックする)
const MEMORY_CLEANUP_INTERVAL_MS = 60_000;
let lastMemoryCleanupAt = 0;

function maybeMemoryCleanup(now: number): void {
	if (now - lastMemoryCleanupAt < MEMORY_CLEANUP_INTERVAL_MS) return;
	lastMemoryCleanupAt = now;
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
	maybeMemoryCleanup(now);
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

// Upstash がスローダウンした場合にリクエスト全体を引きずらないよう、
// 短いタイムアウトで打ち切ってインメモリにフォールバックさせる。
const UPSTASH_FETCH_TIMEOUT_MS = 1000;

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
		cache: "no-store",
		signal: AbortSignal.timeout(UPSTASH_FETCH_TIMEOUT_MS),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Upstash request failed: ${response.status} ${text}`);
	}

	return (await response.json()) as unknown[];
}

interface UpstashResultEntry {
	result?: unknown;
	error?: string;
}

function readUpstashNumber(entry: unknown, fieldLabel: string): number | null {
	if (typeof entry === "number") return entry;
	if (typeof entry === "object" && entry !== null) {
		const obj = entry as UpstashResultEntry;
		if (typeof obj.error === "string" && obj.error.length > 0) {
			// HTTP 200 でも個別コマンドが失敗する pipeline 仕様に対応。
			// 例外を投げて呼び出し側のフォールバック (in-memory) に倒す。
			throw new Error(`Upstash pipeline command failed (${fieldLabel}): ${obj.error}`);
		}
		if (typeof obj.result === "number") return obj.result;
	}
	return null;
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

	const count = readUpstashNumber(results[0], "INCR");
	const ttlMs = readUpstashNumber(results[2], "PTTL");
	if (count === null || ttlMs === null) {
		// レスポンス形状が想定外の場合、count=0 等にフォールバックすると
		// レート制限が事実上バイパスされる (fail-open) ため、例外を投げて
		// 呼び出し側のインメモリフォールバックに倒す。
		throw new Error("Upstash pipeline returned unexpected payload shape");
	}
	const resetAt = ttlMs > 0 ? now + ttlMs : now + windowMs;
	return { count, resetAt };
}

// --- 公開API ---

/**
 * レート制限チェック。
 *
 * IP が解決できない場合 (XFF 不正・全ヘッダ欠落・プロキシ未通過の直撃など) は
 * 共有 "unknown" バケットに集約してカウントする。素通ししてしまうと、攻撃者は
 * `X-Forwarded-For: garbage` のような詐称ヘッダで個別カウントを免除されてしまい、
 * レート制限を完全にバイパスできる。fail-closed 寄りに倒し、共有バケットで
 * 全体の流量だけ抑えることで、正常な多数の匿名トラフィックを過剰に弾かずに
 * 攻撃者の連射だけを抑止する。
 */
export async function rateLimit(
	request: NextRequest,
	config?: RateLimitConfig,
): Promise<RateLimitResult> {
	const resolvedIP = getClientIP(request);
	if (!resolvedIP) {
		logger.warn(
			{
				pathname: request.nextUrl.pathname,
			},
			"Could not determine client IP for rate limiting; falling back to shared 'unknown' bucket",
		);
	}
	const clientIP = resolvedIP ?? "unknown";

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
