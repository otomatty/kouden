import { bindings, defineConfig, triggers } from "cf/config";
import { MODES, resolveMode } from "./deploy.settings.ts";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig(({ mode }) => {
	const s = MODES[resolveMode(mode)];

	return {
		worker: {
			name: s.workerName,
			compatibilityDate: "2026-10-06",
			entrypoint,
			domains: s.domain ? [s.domain] : undefined,
			assets: {
				// 静的ファイルにない URL はすべて Worker が処理する
				notFoundHandling: "none",
			},
			placement: { mode: "smart" },
			observability: {
				enabled: true,
				logs: { enabled: true, invocationLogs: true },
			},
			triggers: [
				// 毎日 03:00 JST（= 18:00 UTC）: 期限切れセッションの掃除など
				triggers.scheduled({ schedule: "0 18 * * *" }),
			],
			env: {
				APP_ORIGIN: bindings.text(s.origin),
				GOOGLE_CLIENT_ID: bindings.text(s.googleClientId),
				GOOGLE_CLIENT_SECRET: bindings.secret(),
				SESSION_SECRET: bindings.secret(),
				DB: bindings.d1({ name: s.d1.name, id: s.d1.id }),
				AUTH_RATE_LIMITER: bindings.rateLimit({
					namespace: s.rateLimitNamespace,
					simple: { limit: 20, period: 60 },
				}),
			},
		},
	};
});
