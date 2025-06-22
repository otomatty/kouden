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
		// Support for Node.js environment tests
		pool: "forks",
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
		// Separate test environments
		environmentMatchGlobs: [
			// React components use jsdom
			["src/**/*.{test,spec}.{js,ts,jsx,tsx}", "jsdom"],
			// CLI scripts use node environment
			["scripts/**/*.{test,spec}.{js,ts}", "node"],
		],
		// Timeout for long-running tests
		testTimeout: 10000,
		// Mock configuration
		mockReset: true,
		clearMocks: true,
		restoreMocks: true,
		// Enable vi global for all test environments
		isolate: false,
	},
});
