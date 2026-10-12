import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export const assetVersion = (process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 8);

export default defineConfig({
	plugins: [cloudflare()],
	define: {
		__ASSET_VERSION__: JSON.stringify(assetVersion),
	},
});
