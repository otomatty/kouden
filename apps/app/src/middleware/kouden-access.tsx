import { createMiddleware } from "hono/factory";
import { Layout } from "../views/layout.tsx";
import { ErrorPage } from "../views/pages/error.tsx";
import { loadKouden } from "../kouden/store.ts";
import { ledgerFor } from "../ledger/client.ts";
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
		tabId: tabIdOf(c.req.header("X-Tab-Id")),
	});
	// 画面全体を返しうる要求（htmx 以外の GET・POST）では、データを読む前の変更ログの位置を記録する。
	// 表示から WebSocket の接続までの間の変更を、接続時に取り直すために使う（04 §5）。
	// POST が入力エラー・競合で画面を返す場合も、その画面のデータはこの位置より後に読む
	if (c.req.header("HX-Request") !== "true" && !c.req.query("partial")) {
		const path = c.req.path;
		if (!path.endsWith("/ws") && !path.endsWith("/changes") && !path.includes("/files/")) {
			const seq = await ledgerFor(c.env, kouden.id).currentSeq(c.get("caller"));
			if (seq.ok) c.set("renderSeq", seq.value);
		}
	}
	return next();
});

/** 画面（タブ）の識別子。ledger-live.js が htmx の要求に付ける */
function tabIdOf(value: string | undefined): string | undefined {
	return value && /^[A-Za-z0-9_-]{8,64}$/.test(value) ? value : undefined;
}

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
