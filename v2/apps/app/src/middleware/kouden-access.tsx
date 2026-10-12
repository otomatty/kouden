import { createMiddleware } from "hono/factory";
import { Layout } from "../views/layout.tsx";
import { ErrorPage } from "../views/pages/error.tsx";
import { loadKouden } from "../kouden/store.ts";
import type { AppEnv } from "../types.ts";

/**
 * /k/:koudenId 配下の共通処理（04 §3 の 2.）。
 * D1 でメンバーシップを確認し、DO に渡す呼び出し元コンテキストを作る。非メンバーには存在自体を隠す（404）。
 * アーカイブ中は閲覧のみ（E2-4）なので、DO には閲覧者として渡す。
 */
export const koudenAccess = createMiddleware<AppEnv>(async (c, next) => {
	const user = c.get("user");
	const koudenId = c.req.param("koudenId");
	if (!user || !koudenId) return c.notFound();
	const kouden = await loadKouden(c.env.DB, koudenId, user.id);
	if (!kouden) return c.notFound();
	c.set("kouden", kouden);
	c.set("caller", {
		koudenId: kouden.id,
		userId: user.id,
		displayName: user.displayName,
		role: kouden.status === "archived" ? "viewer" : kouden.memberRole,
		plan: kouden.plan,
	});
	return next();
});

/** 書き込みの回数制限（ユーザーごと 120 回/分。04 §11） */
export const writeRateLimit = createMiddleware<AppEnv>(async (c, next) => {
	const user = c.get("user");
	if (c.req.method !== "GET" && c.req.method !== "HEAD" && user) {
		const { success } = await c.env.WRITE_RATE_LIMITER.limit({ key: user.id });
		if (!success) {
			return c.html(
				<Layout title="操作が多すぎます" user={user}>
					<ErrorPage status={429} />
				</Layout>,
				429,
			);
		}
	}
	return next();
});
