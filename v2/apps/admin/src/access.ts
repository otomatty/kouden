import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose";
import { log } from "./lib/logger.ts";
import type { AdminDeps, AdminEnv } from "./types.ts";

/**
 * Cloudflare Access（04 §4）。運営者画面は Access の背後に置き、Access が付ける
 * `Cf-Access-Jwt-Assertion` を Access の公開鍵で検証する（iss = チームのドメイン、aud = アプリケーションの AUD タグ）。
 * Access の設定ミスで直接到達できてしまっても、JWT がなければ通さない。
 */

/** JWT を検証し、運営者のメールアドレスを返す。検証できなければ null */
export type AccessVerifier = (token: string) => Promise<string | null>;

const remoteKeys = new Map<string, JWTVerifyGetKey>();

export function accessVerifier(options: {
	teamDomain: string;
	aud: string;
	/** テスト用。省略時は https://<teamDomain>/cdn-cgi/access/certs から取得する（取得結果はキャッシュされる） */
	keys?: JWTVerifyGetKey;
}): AccessVerifier {
	const issuer = `https://${options.teamDomain}`;
	let keys = options.keys ?? remoteKeys.get(issuer);
	if (!keys) {
		keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
		remoteKeys.set(issuer, keys);
	}
	const resolved = keys;
	return async (token) => {
		try {
			const { payload } = await jwtVerify(token, resolved, {
				issuer,
				audience: options.aud,
				algorithms: ["RS256"],
			});
			return typeof payload.email === "string" && payload.email !== ""
				? payload.email.toLowerCase()
				: null;
		} catch {
			return null;
		}
	};
}

export function accessAuth(deps: AdminDeps) {
	return createMiddleware<AdminEnv>(async (c, next) => {
		// development だけは Access を通らないので、設定の運営者として扱う（staging / production では空）
		const devEmail = c.env.ADMIN_DEV_EMAIL;
		if (devEmail) {
			c.set("adminEmail", devEmail);
			return next();
		}
		if (!c.env.ACCESS_TEAM_DOMAIN || !c.env.ACCESS_AUD) {
			log("error", "access_not_configured", {});
			return c.text("Access is not configured", 500);
		}
		const token = c.req.header("Cf-Access-Jwt-Assertion");
		const verify =
			deps.verifyAccess?.(c.env) ??
			accessVerifier({ teamDomain: c.env.ACCESS_TEAM_DOMAIN, aud: c.env.ACCESS_AUD });
		const email = token ? await verify(token) : null;
		if (!email) {
			log("warn", "access_denied", { path: c.req.path, hasToken: Boolean(token) });
			return c.text("Forbidden", 403);
		}
		c.set("adminEmail", email);
		return next();
	});
}
