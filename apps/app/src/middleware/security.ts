import { csrf } from "hono/csrf";
import { NONCE, secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.ts";

export const securityHeaders: MiddlewareHandler<AppEnv> = secureHeaders({
	contentSecurityPolicy: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'", NONCE],
		styleSrc: ["'self'"],
		imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
		connectSrc: ["'self'"],
		fontSrc: ["'self'"],
		objectSrc: ["'none'"],
		baseUri: ["'self'"],
		// 有料版の購入は Stripe Checkout へフォームの送信後にリダイレクトする（リダイレクト先も form-action の対象）
		formAction: ["'self'", "https://checkout.stripe.com"],
		frameAncestors: ["'none'"],
	},
	referrerPolicy: "strict-origin-when-cross-origin",
	permissionsPolicy: {
		camera: [],
		microphone: [],
		geolocation: [],
	},
});

const sameOrigin = csrf({
	origin: (origin, c) => origin === c.env.APP_ORIGIN,
});

/**
 * GET 以外の要求は Origin が自分のオリジンと一致する場合のみ許可する。
 * Stripe の Webhook と、移行ツールが呼ぶ取り込み口（/internal/）はブラウザからの要求ではなく、
 * それぞれ署名・Access で検証するので除く
 */
export const csrfProtection: MiddlewareHandler<AppEnv> = (c, next) =>
	c.req.path === "/webhooks/stripe" || c.req.path.startsWith("/internal/")
		? next()
		: sameOrigin(c, next);
