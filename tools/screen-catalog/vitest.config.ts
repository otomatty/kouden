import { defineConfig } from "vitest/config";

export default defineConfig({
	// ビューが参照する静的ファイルのバージョン（本物は Vite が埋め込む）
	define: { __ASSET_VERSION__: JSON.stringify("catalog") },
});
