import { bindings, defineConfig } from "cf/config";
import { MODES, resolveMode } from "./deploy.settings.ts";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * 運営者画面（04 §4 Cloudflare Access）。利用者向けアプリと同じ D1 を使う。
 * 香典帳の中身（個人情報）は扱わないので、KoudenLedger（DO）には接続しない。
 */
export default defineConfig(({ mode }) => {
	const s = MODES[resolveMode(mode)];

	return {
		worker: {
			name: s.workerName,
			compatibilityDate: "2026-10-06",
			entrypoint,
			domains: s.domain ? [s.domain] : undefined,
			assets: { notFoundHandling: "none" },
			observability: {
				enabled: true,
				logs: { enabled: true, invocationLogs: true },
			},
			env: {
				ADMIN_ORIGIN: bindings.text(s.origin),
				APP_ORIGIN: bindings.text(s.appOrigin),
				ACCESS_TEAM_DOMAIN: bindings.text(s.access.teamDomain),
				ACCESS_AUD: bindings.text(s.access.aud),
				ADMIN_DEV_EMAIL: bindings.text(s.devEmail),
				DB: bindings.d1({ name: s.d1.name, id: s.d1.id }),
			},
		},
	};
});
