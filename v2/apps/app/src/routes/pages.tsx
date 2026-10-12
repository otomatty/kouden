import { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { Layout } from "../views/layout.tsx";
import { DashboardPage } from "../views/pages/dashboard.tsx";
import { FaqPage } from "../views/pages/faq.tsx";
import { HomePage } from "../views/pages/home.tsx";
import { LegalPlaceholderPage } from "../views/pages/legal.tsx";
import { PricingPage } from "../views/pages/pricing.tsx";

export const pageRoutes = new Hono<AppEnv>();

pageRoutes.get("/", (c) => {
	const user = c.get("user");
	if (user) {
		return c.html(
			<Layout title="香典帳一覧" user={user}>
				<DashboardPage user={user} />
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

const LEGAL_PAGES = {
	"/terms": "利用規約",
	"/privacy": "プライバシーポリシー",
	"/legal/tokushoho": "特定商取引法に基づく表記",
} as const;

for (const [path, title] of Object.entries(LEGAL_PAGES)) {
	pageRoutes.get(path, (c) =>
		c.html(
			<Layout title={title} user={c.get("user")}>
				<LegalPlaceholderPage title={title} />
			</Layout>,
		),
	);
}
