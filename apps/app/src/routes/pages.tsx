import { Hono } from "hono";
import { incomingTransfers } from "../kouden/members.ts";
import { listMyKoudens } from "../kouden/store.ts";
import type { AppEnv } from "../types.ts";
import { Layout } from "../views/layout.tsx";
import { DashboardPage } from "../views/pages/dashboard.tsx";
import { FaqPage } from "../views/pages/faq.tsx";
import { HomePage } from "../views/pages/home.tsx";
import { PrivacyPage, TermsPage, TokushohoPage } from "../views/pages/legal.tsx";
import { PricingPage } from "../views/pages/pricing.tsx";

export const pageRoutes = new Hono<AppEnv>();

pageRoutes.get("/", async (c) => {
	const user = c.get("user");
	if (user) {
		const tab = c.req.query("tab") === "archived" ? "archived" : "active";
		const [koudens, transfers] = await Promise.all([
			listMyKoudens(c.env.DB, user.id, tab),
			incomingTransfers(c.env.DB, user.id, c.get("now")),
		]);
		const notices = {
			deleted: "香典帳を削除しました。",
			left: "香典帳から抜けました。",
			legacy_missing:
				"以前のアドレスの香典帳が見つからないか、開く権限がありません。一覧から開いてください。",
		} as const;
		const key = c.req.query("notice");
		const notice = key && key in notices ? notices[key as keyof typeof notices] : undefined;
		return c.html(
			<Layout title="香典帳一覧" user={user}>
				<DashboardPage koudens={koudens} tab={tab} notice={notice} transfers={transfers} />
			</Layout>,
		);
	}
	return c.html(
		<Layout user={null}>
			<HomePage />
		</Layout>,
	);
});

pageRoutes.get("/pricing", (c) =>
	c.html(
		<Layout title="料金" user={c.get("user")}>
			<PricingPage />
		</Layout>,
	),
);

pageRoutes.get("/faq", (c) =>
	c.html(
		<Layout title="よくある質問" user={c.get("user")}>
			<FaqPage />
		</Layout>,
	),
);

const LEGAL_PAGES = [
	["/terms", "利用規約", TermsPage],
	["/privacy", "プライバシーポリシー", PrivacyPage],
	["/legal/tokushoho", "特定商取引法に基づく表記", TokushohoPage],
] as const;

for (const [path, title, Page] of LEGAL_PAGES) {
	pageRoutes.get(path, (c) =>
		c.html(
			<Layout title={title} user={c.get("user")}>
				<Page />
			</Layout>,
		),
	);
}
