import { readFileSync } from "node:fs";
import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Vitest 連携は cloudflare.config.ts を読めないため、テスト用の binding をここで宣言する。
 * 宣言漏れを防ぐため、cloudflare.config.ts の env のキーと一致しているかを起動時に検査する。
 */
const TEST_BINDINGS = {
	APP_ORIGIN: "http://localhost:5173",
	GOOGLE_CLIENT_ID: "test-client-id",
	GOOGLE_CLIENT_SECRET: "test-client-secret",
	SESSION_SECRET: "test-session-secret",
} as const;
const TEST_D1 = ["DB"] as const;
const TEST_DURABLE_OBJECTS = {
	LEDGER: { className: "KoudenLedger", useSQLite: true },
};
const TEST_RATE_LIMITS = {
	AUTH_RATE_LIMITER: { namespace_id: "9001", simple: { limit: 20, period: 60 as const } },
	WRITE_RATE_LIMITER: { namespace_id: "9002", simple: { limit: 120, period: 60 as const } },
	INVITE_RATE_LIMITER: { namespace_id: "9003", simple: { limit: 10, period: 60 as const } },
};

function assertBindingsMatchConfig(): void {
	const source = readFileSync(path.join(import.meta.dirname, "cloudflare.config.ts"), "utf8");
	const configKeys = [...source.matchAll(/^\s+([A-Z][A-Z0-9_]*): bindings\./gm)].map((m) => m[1]);
	const testKeys = [
		...Object.keys(TEST_BINDINGS),
		...TEST_D1,
		...Object.keys(TEST_DURABLE_OBJECTS),
		...Object.keys(TEST_RATE_LIMITS),
	];
	const missing = configKeys.filter((k) => !testKeys.includes(k as string));
	const extra = testKeys.filter((k) => !configKeys.includes(k));
	if (missing.length > 0 || extra.length > 0) {
		throw new Error(
			`vitest.config.ts の binding が cloudflare.config.ts と一致しません。不足: [${missing.join(", ")}] 余分: [${extra.join(", ")}]`,
		);
	}
}

export default defineConfig({
	plugins: [
		cloudflareTest(async () => {
			assertBindingsMatchConfig();
			const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));
			return {
				main: "./src/index.ts",
				miniflare: {
					compatibilityDate: "2026-10-06",
					d1Databases: [...TEST_D1],
					durableObjects: TEST_DURABLE_OBJECTS,
					ratelimits: TEST_RATE_LIMITS,
					bindings: { ...TEST_BINDINGS, TEST_MIGRATIONS: migrations },
				},
			};
		}),
	],
	define: {
		__ASSET_VERSION__: JSON.stringify("test"),
	},
	test: {
		// Vitest 5 のファイルシステムキャッシュは、Workers ランタイム側から読めずに失敗するため無効にする
		// （@cloudflare/vitest-plugin 1.4.0 時点）
		fsModuleCache: false,
		setupFiles: ["./test/apply-migrations.ts"],
	},
});
