import { bindings, defineConfig, exports, triggers } from "cf/config";
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
			workersDev: !s.domain,
			previewUrls: false,
			assets: {
				// 静的ファイルにない URL はすべて Worker が処理する
				notFoundHandling: "none",
			},
			placement: { mode: "smart" },
			observability: {
				enabled: true,
				redactQueryString: true,
				logs: { enabled: true, invocationLogs: true },
				traces: { enabled: true, headSamplingRate: 0.1 },
			},
			triggers: [
				// 毎日 03:00 JST（= 18:00 UTC）: 期限切れセッションの掃除など
				triggers.scheduled({ schedule: "0 18 * * *" }),
			],
			exports: {
				// 香典帳 1 冊 = 1 オブジェクト（03 §3）
				KoudenLedger: exports.durableObject({ storage: "sqlite" }),
			},
			env: {
				APP_ORIGIN: bindings.text(s.origin),
				APP_ACCESS_REQUIRED: bindings.text(
					["staging", "rehearsal"].includes(resolveMode(mode)) ? "true" : "false",
				),
				APP_ACCESS_TEAM_DOMAIN: bindings.text(s.access.teamDomain),
				APP_ACCESS_AUD: bindings.text(s.access.aud),
				GOOGLE_CLIENT_ID: bindings.text(s.googleClientId),
				GOOGLE_CLIENT_SECRET: bindings.secret(),
				SESSION_SECRET: bindings.secret(),
				// 有料版の購入（04 §7）。Checkout Session の作成と Webhook の署名検証に使う
				STRIPE_SECRET_KEY: s.billingEnabled ? bindings.secret() : bindings.text(""),
				STRIPE_WEBHOOK_SECRET: s.billingEnabled ? bindings.secret() : bindings.text(""),
				DB: bindings.d1({ name: s.d1.name, id: s.d1.id }),
				// 返礼品の画像（04 §2）。キーは koudens/{koudenId}/… で、香典帳の削除時にまとめて消す
				FILES: bindings.r2({ name: s.r2.name }),
				// 香典返しの期限のお知らせ（04 §9）
				...(s.mailFrom
					? {
							EMAIL: bindings.sendEmail({ allowedSenderAddresses: [s.mailFrom] }),
						}
					: {}),
				MAIL_FROM: bindings.text(s.mailFrom),
				// 旧アプリからのデータ移行の取り込み口（05 §2）。空なら無効
				IMPORT_ACCESS_TEAM_DOMAIN: bindings.text(s.importAccess.teamDomain),
				IMPORT_ACCESS_AUD: bindings.text(s.importAccess.aud),
				IMPORT_DEV_TOKEN: bindings.text(s.importDevToken),
				LEDGER: bindings.durableObject({ worker: s.workerName, exportName: "KoudenLedger" }),
				AUTH_RATE_LIMITER: bindings.rateLimit({
					namespace: s.rateLimitNamespaces.auth,
					simple: { limit: 20, period: 60 },
				}),
				// 書き込み: ユーザーごと 120 回/分（04 §11）
				WRITE_RATE_LIMITER: bindings.rateLimit({
					namespace: s.rateLimitNamespaces.write,
					simple: { limit: 120, period: 60 },
				}),
				// 招待の受諾: IP ごと 10 回/分（04 §11）
				INVITE_RATE_LIMITER: bindings.rateLimit({
					namespace: s.rateLimitNamespaces.invite,
					simple: { limit: 10, period: 60 },
				}),
			},
		},
	};
});
