import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose";
import { sha256 } from "../lib/crypto.ts";
import { log } from "../lib/logger.ts";
import type { AppDeps, AppEnv } from "../types.ts";

/**
 * データ移行の取り込み口（/internal/import/*、05 §2）の認証。
 *
 * - staging / production: Cloudflare Access のサービストークン。Access が付ける `Cf-Access-Jwt-Assertion` を
 *   Access の公開鍵で検証する（iss = チームのドメイン、aud = 取り込み用のアプリケーションの AUD タグ）。
 *   Access の設定ミスで直接到達できてしまっても、JWT がなければ通さない
 * - development: `IMPORT_DEV_TOKEN`（Authorization: Bearer）。staging / production では deployBlockers が止める
 * - どちらも設定されていなければ、取り込み口は存在しないものとして 404 を返す（切り替え後は無効にする）
 */

/** JWT を検証できれば true */
export type ImportAccessVerifier = (token: string) => Promise<boolean>;

const remoteKeys = new Map<string, JWTVerifyGetKey>();

export function importAccessVerifier(options: {
	teamDomain: string;
	aud: string;
	/** テスト用。省略時は https://<teamDomain>/cdn-cgi/access/certs から取得する */
	keys?: JWTVerifyGetKey;
}): ImportAccessVerifier {
	const issuer = `https://${options.teamDomain}`;
	let keys = options.keys ?? remoteKeys.get(issuer);
	if (!keys) {
		keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
		remoteKeys.set(issuer, keys);
	}
	const resolved = keys;
	return async (token) => {
		try {
			await jwtVerify(token, resolved, {
				issuer,
				audience: options.aud,
				algorithms: ["RS256"],
			});
			return true;
		} catch {
			return false;
		}
	};
}

async function sameSecret(given: string, expected: string): Promise<boolean> {
	const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
	return crypto.subtle.timingSafeEqual(a, b);
}

export function importAuth(deps: AppDeps) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const devToken = c.env.IMPORT_DEV_TOKEN;
		if (devToken) {
			const header = c.req.header("Authorization") ?? "";
			const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
			if (token !== "" && (await sameSecret(token, devToken))) return next();
			log("warn", "import_denied", { path: c.req.path, reason: "dev_token" });
			return c.text("Forbidden", 403);
		}
		const teamDomain = c.env.IMPORT_ACCESS_TEAM_DOMAIN;
		const aud = c.env.IMPORT_ACCESS_AUD;
		if (!teamDomain || !aud) return c.notFound();
		const token = c.req.header("Cf-Access-Jwt-Assertion");
		const verify = deps.verifyImportAccess?.(c.env) ?? importAccessVerifier({ teamDomain, aud });
		if (!token || !(await verify(token))) {
			log("warn", "import_denied", { path: c.req.path, hasToken: Boolean(token) });
			return c.text("Forbidden", 403);
		}
		return next();
	});
}
