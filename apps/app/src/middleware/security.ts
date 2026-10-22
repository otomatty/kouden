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
export const csrfProtection: MiddlewareHandler<AppEnv> = async (c, next) => {
	if (c.req.path === "/webhooks/stripe" || c.req.path.startsWith("/internal/")) return next();
	// hono/csrf はフォームの形（form-urlencoded・multipart・text/plain）の要求だけを確かめる。
	// JSON（表で入力の保存）など、ほかの形の要求も同じ条件（Sec-Fetch-Site が same-origin か、
	// Origin が自分のオリジン）で確かめる。フォームの要求は hono/csrf に任せる（招待の画面は
	// Referrer-Policy: no-referrer のため Origin が null になり、Sec-Fetch-Site で通る）
	const unsafe = !/^(GET|HEAD|OPTIONS)$/.test(c.req.method);
	const form = FORM_CONTENT_TYPE.test(c.req.header("Content-Type") ?? "");
	const sameSite =
		c.req.header("Sec-Fetch-Site") === "same-origin" || c.req.header("Origin") === c.env.APP_ORIGIN;
	if (unsafe && !form && !sameSite) return c.text("Forbidden", 403);
	return sameOrigin(c, next);
};

const FORM_CONTENT_TYPE =
	/^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;
