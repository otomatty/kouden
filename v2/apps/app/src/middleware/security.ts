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
		formAction: ["'self'"],
		frameAncestors: ["'none'"],
	},
	referrerPolicy: "strict-origin-when-cross-origin",
	permissionsPolicy: {
		camera: [],
		microphone: [],
		geolocation: [],
	},
});

/** GET 以外の要求は Origin が自分のオリジンと一致する場合のみ許可する */
export const csrfProtection: MiddlewareHandler<AppEnv> = csrf({
	origin: (origin, c) => origin === c.env.APP_ORIGIN,
});
