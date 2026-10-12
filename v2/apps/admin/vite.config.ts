import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	// ローカルでは、利用者向けアプリ（apps/app）の `cf dev` と同じ D1 を見る
	plugins: [cloudflare({ persistState: { path: "../app/.cloudflare/state" } })],
	server: { port: 5174 },
	define: {
		__ASSET_VERSION__: JSON.stringify(
			(process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 8),
		),
	},
});
