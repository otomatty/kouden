import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { loadSession, SESSION_TTL_MS } from "../auth/session-store.ts";
import type { AppEnv } from "../types.ts";

/** Cookie 名。`__Host-` 接頭辞付きで発行される（Secure・Path=/・Domain なしが強制される） */
const SESSION_COOKIE = "kouden_session";

export function setSessionCookie(c: Context<AppEnv>, token: string): void {
	setCookie(c, SESSION_COOKIE, token, {
		prefix: "host",
		httpOnly: true,
		secure: true,
		sameSite: "Lax",
		path: "/",
		maxAge: Math.floor(SESSION_TTL_MS / 1000),
	});
}

export function clearSessionCookie(c: Context<AppEnv>): void {
	deleteCookie(c, SESSION_COOKIE, { prefix: "host", path: "/", secure: true });
}

/** Cookie からセッションを読み、`c.var.user` に設定する（未ログインなら null のまま） */
export const session = createMiddleware<AppEnv>(async (c, next) => {
	const token = getCookie(c, SESSION_COOKIE, "host");
	if (token) {
		const loaded = await loadSession(c.env.DB, token, c.get("now"));
		if (loaded) {
			c.set("user", loaded.user);
			c.set("sessionToken", token);
			if (loaded.extended) setSessionCookie(c, token);
		} else {
			clearSessionCookie(c);
		}
	}
	await next();
});

/** ログイン必須のルートに付ける。未ログインならログイン画面へ（元の URL を保持） */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
	if (!c.get("user")) {
		// GET 以外（フォーム送信など）は同じ URL に戻せないので、ログイン後はトップへ
		if (c.req.method !== "GET") return c.redirect("/login");
		const returnTo = c.req.path + (new URL(c.req.url).search || "");
		return c.redirect(`/login?return_to=${encodeURIComponent(returnTo)}`);
	}
	return next();
});
