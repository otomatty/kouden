import { Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { base64url, randomToken, sha256 } from "../lib/crypto.ts";
import { log } from "../lib/logger.ts";
import { clearSessionCookie, requireUser, setSessionCookie } from "../middleware/session.ts";
import type { AppDeps, AppEnv } from "../types.ts";
import { Layout } from "../views/layout.tsx";
import { LOGIN_ERRORS, LoginPage, type LoginErrorCode } from "../views/pages/login.tsx";
import { googleOidc, OidcError, type OidcProvider } from "./google.ts";
import { createSession, deleteAllSessions, deleteSession } from "./session-store.ts";
import { resolveUserFromGoogle } from "./users.ts";

/** OAuth の一時情報（state / nonce / PKCE）を入れる署名付き Cookie */
const OAUTH_COOKIE = "kouden_oauth";
const OAUTH_COOKIE_MAX_AGE = 10 * 60;

interface OAuthState {
	state: string;
	nonce: string;
	verifier: string;
	returnTo: string;
}

/** オープンリダイレクトを防ぐため、自サイト内の相対パスだけを許可する */
export function safeReturnTo(value: string | undefined): string {
	if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
		return "/";
	}
	return value;
}

function isLoginError(value: string | undefined): value is LoginErrorCode {
	return value !== undefined && Object.hasOwn(LOGIN_ERRORS, value);
}

function redirectUri(env: Env): string {
	return `${env.APP_ORIGIN}/auth/google/callback`;
}

export function authRoutes(deps: AppDeps) {
	const oidcFor = (env: Env): OidcProvider =>
		deps.oidc?.(env) ??
		googleOidc({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET });

	const app = new Hono<AppEnv>();

	app.get("/login", (c) => {
		const returnTo = safeReturnTo(c.req.query("return_to"));
		if (c.get("user")) return c.redirect(returnTo);

		const error = c.req.query("error");
		const startUrl = `/auth/google/start?return_to=${encodeURIComponent(returnTo)}`;
		return c.html(
			<Layout title="ログイン" user={null}>
				<LoginPage startUrl={startUrl} error={isLoginError(error) ? error : undefined} />
			</Layout>,
		);
	});

	app.get("/auth/google/start", async (c) => {
		const ip = c.req.header("cf-connecting-ip") ?? "unknown";
		const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: `login:${ip}` });
		if (!success) return c.redirect("/login?error=rate_limited");

		const pending: OAuthState = {
			state: randomToken(),
			nonce: randomToken(),
			verifier: randomToken(),
			returnTo: safeReturnTo(c.req.query("return_to")),
		};
		await setSignedCookie(c, OAUTH_COOKIE, JSON.stringify(pending), c.env.SESSION_SECRET, {
			prefix: "host",
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			path: "/",
			maxAge: OAUTH_COOKIE_MAX_AGE,
		});

		const url = oidcFor(c.env).authorizationUrl({
			state: pending.state,
			nonce: pending.nonce,
			codeChallenge: base64url(await sha256(pending.verifier)),
			redirectUri: redirectUri(c.env),
		});
		return c.redirect(url);
	});

	app.get("/auth/google/callback", async (c) => {
		const raw = await getSignedCookie(c, c.env.SESSION_SECRET, OAUTH_COOKIE, "host");
		deleteCookie(c, OAUTH_COOKIE, { prefix: "host", path: "/", secure: true });

		if (c.req.query("error")) return c.redirect("/login?error=cancelled");
		if (!raw) return c.redirect("/login?error=expired");

		let pending: OAuthState;
		try {
			pending = JSON.parse(raw) as OAuthState;
		} catch {
			return c.redirect("/login?error=expired");
		}

		const code = c.req.query("code");
		if (!code || c.req.query("state") !== pending.state) {
			log("warn", "oauth_state_mismatch", { requestId: c.get("requestId") });
			return c.redirect("/login?error=failed");
		}

		let claims;
		try {
			claims = await oidcFor(c.env).exchangeAndVerify({
				code,
				codeVerifier: pending.verifier,
				redirectUri: redirectUri(c.env),
				nonce: pending.nonce,
			});
		} catch (e) {
			if (e instanceof OidcError) {
				log("warn", "oauth_failed", { requestId: c.get("requestId"), reason: e.message });
				return c.redirect("/login?error=failed");
			}
			throw e;
		}

		const now = c.get("now");
		const { userId, outcome } = await resolveUserFromGoogle(c.env.DB, claims, now);
		const token = await createSession(c.env.DB, userId, now, c.req.header("user-agent") ?? null);
		setSessionCookie(c, token);
		log("info", "login", { requestId: c.get("requestId"), userId, outcome });

		return c.redirect(pending.returnTo);
	});

	app.post("/logout", async (c) => {
		const token = c.get("sessionToken");
		if (token) await deleteSession(c.env.DB, token);
		clearSessionCookie(c);
		return c.redirect("/");
	});

	app.post("/logout/all", requireUser, async (c) => {
		const user = c.get("user");
		if (user) await deleteAllSessions(c.env.DB, user.id);
		clearSessionCookie(c);
		return c.redirect("/");
	});

	return app;
}
