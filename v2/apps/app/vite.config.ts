import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export const assetVersion = (process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 8);

export default defineConfig({
	// E2E（v2/e2e）は KOUDEN_LOCAL_STATE で別の保存先を使い、開発中のデータと混ぜない
	plugins: [
		cloudflare(
			process.env.KOUDEN_LOCAL_STATE
				? { persistState: { path: process.env.KOUDEN_LOCAL_STATE } }
				: {},
		),
	],
	define: {
		__ASSET_VERSION__: JSON.stringify(assetVersion),
	},
});
