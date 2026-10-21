import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// PGlite（WASM の Postgres）で SQL を流すテストは CI で 1 件 5 秒前後かかり、既定の 5 秒では時々落ちる。
		testTimeout: 20000,
	},
});
