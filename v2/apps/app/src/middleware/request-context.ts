import { createMiddleware } from "hono/factory";
import { log } from "../lib/logger.ts";
import type { AppDeps, AppEnv } from "../types.ts";

/** リクエスト ID・現在時刻の設定と、アクセスログの出力 */
export function requestContext(deps: AppDeps) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const requestId = c.req.header("cf-ray") ?? crypto.randomUUID();
		c.set("requestId", requestId);
		c.set("now", deps.now?.() ?? new Date());
		c.set("user", null);
		c.set("sessionToken", null);

		const started = Date.now();
		await next();
		log("info", "request", {
			requestId,
			method: c.req.method,
			// クエリは記録しない（OAuth の code などを含むため）
			path: c.req.path,
			status: c.res.status,
			ms: Date.now() - started,
			userId: c.get("user")?.id ?? null,
		});
	});
}
