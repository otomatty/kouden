import { defineConfig, devices } from "@playwright/test";
import { STATE_DIR } from "./scripts/state.ts";

const CI = Boolean(process.env.CI);
const env = { KOUDEN_LOCAL_STATE: STATE_DIR };
// 手元に別の版の Chromium がある場合に使う（CI は `playwright install` したものを使う）
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH
	? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
	: {};

/**
 * ローカルの `cf dev`（利用者向けアプリ :5173・運営者画面 :5174）に対して実行する。
 * 起動前に scripts/prepare.ts が専用の D1 を作り直す（`bun run e2e`）。
 */
export default defineConfig({
	testDir: "tests",
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? 1 : 0,
	workers: CI ? 2 : 3,
	reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
	timeout: 60_000,
	expect: { timeout: 10_000 },
	use: {
		baseURL: "http://localhost:5173",
		locale: "ja-JP",
		timezoneId: "Asia/Tokyo",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "app",
			testIgnore: "admin.spec.ts",
			use: { ...devices["Desktop Chrome"], launchOptions },
		},
		// 運営者画面はローカルでは別の workerd が同じ SQLite ファイルを開くため、利用者向けアプリの書き込みと
		// 重なると SQLITE_BUSY になる（本番の D1 では起きない）。利用者向けアプリのテストが終わってから実行する
		{
			name: "admin",
			testMatch: "admin.spec.ts",
			dependencies: ["app"],
			use: { ...devices["Desktop Chrome"], launchOptions },
		},
	],
	webServer: [
		{
			command: "bun run serve",
			cwd: "../apps/app",
			url: "http://localhost:5173/healthz",
			env,
			reuseExistingServer: false,
			timeout: 120_000,
		},
		{
			command: "bun run dev",
			cwd: "../apps/admin",
			url: "http://localhost:5174/",
			env,
			reuseExistingServer: false,
			timeout: 120_000,
		},
	],
});
