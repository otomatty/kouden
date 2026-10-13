import { createMiddleware } from "hono/factory";
import { importAccessVerifier } from "../migration/auth.ts";
import type { AppDeps, AppEnv } from "../types.ts";

/** Access の設定漏れや別の URL からの到達でも、staging のデータを公開しない。 */
export function stagingAccess(deps: AppDeps) {
	return createMiddleware<AppEnv>(async (c, next) => {
		if (c.env.APP_ACCESS_REQUIRED !== "true") return next();
		// この範囲には internalRoutes の importAuth が必ず適用される。
		if (c.req.path.startsWith("/internal/import/")) return next();
		const teamDomain = c.env.APP_ACCESS_TEAM_DOMAIN;
		const aud = c.env.APP_ACCESS_AUD;
		if (!teamDomain || !aud) return c.text("Access is not configured", 503);
		const token = c.req.header("Cf-Access-Jwt-Assertion");
		const verify = deps.verifyAppAccess?.(c.env) ?? importAccessVerifier({ teamDomain, aud });
		if (!token || !(await verify(token))) return c.text("Forbidden", 403);
		return next();
	});
}
