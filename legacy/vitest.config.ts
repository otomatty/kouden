import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "node:path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		// Run all test files in a single fork. Vitest 4 removed
		// poolOptions.forks.singleFork; the top-level fileParallelism: false
		// forces a single worker (maxWorkers = 1) for the forks pool.
		pool: "forks",
		fileParallelism: false,
		// Test configuration for different environments
		env: {
			NODE_ENV: "test",
		},
		// Include both React and Node.js tests
		include: [
			"src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
			"scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
		],
		// Exclude integration test output
		exclude: ["node_modules", "dist", ".git", "scripts/__tests__/test-output"],
		// Default environment is jsdom (React components). Vitest 4 removed
		// environmentMatchGlobs; CLI script tests under scripts/ opt into the
		// node environment via a `// @vitest-environment node` docblock.
		// Timeout for long-running tests
		testTimeout: 10000,
		// Mock configuration
		mockReset: true,
		clearMocks: true,
		restoreMocks: true,
		// Isolate test modules to prevent state leakage between files
		// (required when running in a single fork)
		isolate: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			reportOnFailure: true,
			include: [
				"src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
				"scripts/**/*.{js,mjs,cjs,ts,mts,cts}",
			],
			exclude: [
				"**/*.stories.*",
				"**/*.d.ts",
				"**/__tests__/**",
				"**/*.{test,spec}.*",
				"scripts/__tests__/test-output/**",
			],
		},
	},
});
