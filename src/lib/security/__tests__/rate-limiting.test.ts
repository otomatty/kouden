/// <reference types="vitest" />
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
	default: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

type RateLimitFn = typeof import("../rate-limiting").rateLimit;

function buildRequest(pathname: string, headers: Record<string, string>) {
	const h = new Headers();
	for (const [k, v] of Object.entries(headers)) h.set(k, v);
	return {
		headers: h,
		nextUrl: { pathname },
	} as unknown as Parameters<RateLimitFn>[0];
}

async function freshRateLimit(): Promise<RateLimitFn> {
	vi.resetModules();
	const mod = await import("../rate-limiting");
	return mod.rateLimit;
}

describe("rateLimit (in-memory fallback)", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	function clearUpstashEnv() {
		vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
		vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
	}

	it("初回リクエストは成功し残り回数を返す", async () => {
		clearUpstashEnv();
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", { "x-forwarded-for": "1.2.3.4" });
		const result = await rateLimit(req, { windowMs: 60_000, maxRequests: 5 });
		expect(result.success).toBe(true);
		expect(result.remainingRequests).toBe(4);
	});

	it("maxRequests を超えると success=false を返す", async () => {
		clearUpstashEnv();
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", { "x-forwarded-for": "1.2.3.4" });
		const config = { windowMs: 60_000, maxRequests: 3 };
		await rateLimit(req, config);
		await rateLimit(req, config);
		await rateLimit(req, config);
		const fourth = await rateLimit(req, config);
		expect(fourth.success).toBe(false);
		expect(fourth.remainingRequests).toBe(0);
	});

	it("クライアントIPが不明な場合は素通しする", async () => {
		clearUpstashEnv();
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", {});
		const result = await rateLimit(req, { windowMs: 60_000, maxRequests: 1 });
		expect(result.success).toBe(true);
	});

	it("異なるIPはカウンタを共有しない", async () => {
		clearUpstashEnv();
		const rateLimit = await freshRateLimit();
		const config = { windowMs: 60_000, maxRequests: 1 };
		const a = await rateLimit(buildRequest("/api/x", { "x-forwarded-for": "1.1.1.1" }), config);
		const b = await rateLimit(buildRequest("/api/x", { "x-forwarded-for": "2.2.2.2" }), config);
		expect(a.success).toBe(true);
		expect(b.success).toBe(true);
	});
});

describe("rateLimit (Upstash failure fallback)", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	function stubUpstashEnv() {
		vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
		vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
	}

	it("Upstash が 500 を返した場合インメモリにフォールバックする", async () => {
		stubUpstashEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("boom", { status: 500 })),
		);
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", { "x-forwarded-for": "1.2.3.4" });
		const result = await rateLimit(req, { windowMs: 60_000, maxRequests: 2 });
		expect(result.success).toBe(true);
		expect(result.remainingRequests).toBe(1);
	});

	it("Upstash が pipeline 個別エラーを返した場合もフォールバックする", async () => {
		stubUpstashEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify([{ error: "ERR boom" }, { result: 1 }, { result: 100 }]), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", { "x-forwarded-for": "1.2.3.4" });
		const result = await rateLimit(req, { windowMs: 60_000, maxRequests: 2 });
		expect(result.success).toBe(true);
		expect(result.remainingRequests).toBe(1);
	});

	it("Upstash 通信が AbortError でタイムアウトした場合もフォールバックする", async () => {
		stubUpstashEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new DOMException("aborted", "AbortError");
			}),
		);
		const rateLimit = await freshRateLimit();
		const req = buildRequest("/api/foo", { "x-forwarded-for": "1.2.3.4" });
		const result = await rateLimit(req, { windowMs: 60_000, maxRequests: 2 });
		expect(result.success).toBe(true);
		expect(result.remainingRequests).toBe(1);
	});
});
