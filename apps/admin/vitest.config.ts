import { readFileSync } from "node:fs";
import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * テスト用の binding。cloudflare.config.ts の env のキーと一致しているかを起動時に検査する。
 * D1 のマイグレーションは利用者向けアプリ（apps/app/migrations）のものを使う。
 */
const TEST_BINDINGS = {
	ADMIN_ORIGIN: "http://localhost:5174",
	APP_ORIGIN: "http://localhost:5173",
	ACCESS_TEAM_DOMAIN: "kouden-test.cloudflareaccess.com",
	ACCESS_AUD: "test-aud",
	// テストでは Access の検証を通す（迂回しない）
	ADMIN_DEV_EMAIL: "",
} as const;
const TEST_D1 = ["DB"] as const;

function assertBindingsMatchConfig(): void {
	const source = readFileSync(path.join(import.meta.dirname, "cloudflare.config.ts"), "utf8");
	const configKeys = [...source.matchAll(/^\s+([A-Z][A-Z0-9_]*): bindings\./gm)].map((m) => m[1]);
	const testKeys = [...Object.keys(TEST_BINDINGS), ...TEST_D1];
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
			const migrations = await readD1Migrations(
				path.join(import.meta.dirname, "../app/migrations"),
			);
			return {
				main: "./src/index.ts",
				miniflare: {
					compatibilityDate: "2026-10-06",
					d1Databases: [...TEST_D1],
					bindings: { ...TEST_BINDINGS, TEST_MIGRATIONS: migrations },
				},
			};
		}),
	],
	define: {
		__ASSET_VERSION__: JSON.stringify("test"),
	},
	test: {
		fsModuleCache: false,
		setupFiles: ["./test/apply-migrations.ts"],
	},
});
