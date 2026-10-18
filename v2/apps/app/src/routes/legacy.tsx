import { Hono } from "hono";
import { safeReturnTo } from "../auth/routes.tsx";
import { findKoudenIdByLegacyId } from "../kouden/store.ts";
import { requireUser } from "../middleware/session.ts";
import type { AppEnv } from "../types.ts";
import { Layout } from "../views/layout.tsx";
import { ErrorPage } from "../views/pages/error.tsx";
import type { Ctx } from "./helpers.tsx";

/**
 * 旧アプリ（Next.js）の URL の受け口（07「旧 URL と新しい経路の対応」）。
 * 旧ドメインはパスとクエリを保ったまま転送してくる。行き先が利用者や切り戻しで変わりうるので、
 * 転送はすべて 302 にしてブラウザに保存させない。
 */
export const legacyRoutes = new Hono<AppEnv>();

/** 旧ドメインからはパスがそのまま届くので、末尾に `/` が付いた形（`/koudens/` など）も受ける */
const withSlash = (path: string) => [path, `${path}/`];

/** `path` に元の要求のクエリを足す（`path` 側にある項目はそちらを優先する。同名の項目はすべて引き継ぐ） */
function withQuery(c: Ctx, path: string): string {
	const to = new URL(path, c.req.url);
	const fixed = new Set(to.searchParams.keys());
	for (const [key, value] of new URL(c.req.url).searchParams) {
		if (!fixed.has(key)) to.searchParams.append(key, value);
	}
	return to.pathname + to.search;
}

/** 旧アプリの `/koudens/:id/` 以下の残りのパス → v2 の `/k/:id` 以下 */
export function koudenSubpath(rest: string): string {
	const [first, second] = rest.split("/");
	switch (first) {
		case "entries":
		case "offerings":
			return "/gifts";
		case "telegrams":
			return "/gifts?kind=choden";
		case "members":
			return "/members";
		case "return_records":
			return second === "items" ? "/returns/settings" : "/returns";
		case "settings":
			if (second === "members") return "/members";
			if (second === "return-items") return "/returns/settings";
			return "/settings";
		default:
			// 概要・統計・アーカイブ済みの表示などは香典帳のトップへ
			return "";
	}
}

/** 旧アプリのログイン（`redirectTo` で戻り先を受けていた） */
legacyRoutes.on("GET", withSlash("/auth/login"), (c) => {
	const returnTo = safeReturnTo(c.req.query("redirectTo"));
	return c.redirect(
		returnTo === "/" ? "/login" : `/login?return_to=${encodeURIComponent(returnTo)}`,
	);
});

/** 旧アプリの OAuth のコールバック。旧方式のコードは使えないので、クエリは捨てる */
legacyRoutes.on("GET", withSlash("/auth/callback"), (c) => c.redirect("/login"));

const RENAMED = {
	"/koudens": "/",
	"/koudens/new": "/k/new",
	"/profile": "/account",
	"/settings": "/account",
	"/legal": "/legal/tokushoho",
} as const;

for (const [from, to] of Object.entries(RENAMED)) {
	legacyRoutes.on("GET", withSlash(from), (c) => c.redirect(withQuery(c, to)));
}

/** v2 にない公開ページ（機能紹介・マニュアル・お問い合わせなど）はトップへ */
const RETIRED = [
	"/features",
	"/guide",
	"/manuals",
	"/help",
	"/contact",
	"/changelogs",
	"/milestones",
	"/plans",
	"/promotions",
	"/developers",
];

for (const path of RETIRED) {
	// `/features/*` は `/features/` にも当たる
	legacyRoutes.on("GET", [path, `${path}/*`], (c) => c.redirect("/"));
}

/** 招待は移行しない（05 §3）。旧リンクを開いた人に作り直しを案内する */
const invitationGone = (c: Ctx) =>
	c.html(
		<Layout title="この招待リンクは使えません" user={c.get("user")}>
			<ErrorPage status={410} />
		</Layout>,
		410,
	);
legacyRoutes.on("GET", withSlash("/invitations/:token"), invitationGone);
legacyRoutes.on("GET", withSlash("/invitation-error"), invitationGone);

/** 旧 ID の香典帳を、閲覧者がメンバーなら v2 の対応する画面へ。見つからなければ一覧へ */
async function toKouden(c: Ctx, legacyId: string, subpath: string) {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	const id = await findKoudenIdByLegacyId(c.env.DB, legacyId, user.id);
	if (!id) return c.redirect("/?notice=legacy_missing");
	return c.redirect(withQuery(c, `/k/${id}${subpath}`));
}

// `/purchase/:legacyId/*` は `/purchase/:legacyId` と `/purchase/:legacyId/` にも当たる
legacyRoutes.get("/purchase/:legacyId/*", requireUser, (c) =>
	toKouden(c, c.req.param("legacyId"), "/settings"),
);
legacyRoutes.get("/koudens/:legacyId", requireUser, (c) =>
	toKouden(c, c.req.param("legacyId"), ""),
);
// `/koudens/:legacyId/*` は `/koudens/:legacyId/` にも当たる
legacyRoutes.get("/koudens/:legacyId/*", requireUser, (c) => {
	const rest = c.req.path.split("/").slice(3).join("/");
	return toKouden(c, c.req.param("legacyId"), koudenSubpath(rest));
});
