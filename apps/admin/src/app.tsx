import { type Context, Hono } from "hono";
import type { Child } from "hono/jsx";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { accessAuth } from "./access.ts";
import { log } from "./lib/logger.ts";
import {
	auditLogs,
	dashboard,
	grantPaid,
	koudenDetail,
	legacyUser,
	linkCandidates,
	linkLegacyUser,
	listLegacyUsers,
	revokePurchase,
	searchKoudens,
	searchUsers,
	userDetail,
} from "./store.ts";
import type { AdminDeps, AdminEnv } from "./types.ts";
import { AdminLayout, Notice } from "./views/layout.tsx";
import {
	AuditPage,
	DashboardPage,
	KoudenPage,
	LegacyListPage,
	LinkPage,
	SearchPage,
	UserPage,
} from "./views/pages.tsx";

const NOTICES = {
	granted: "有料にしました。",
	revoked: "購入を取り消しました。",
	revoked_downgraded: "購入を取り消し、無料に戻しました。",
	linked: "旧アカウントに紐づけました。本人には、もう一度ログインするよう案内してください。",
} as const;

const LINK_ERRORS = {
	legacy_not_found: "旧ユーザーが見つかりません。",
	already_linked: "すでに紐づけ済みです。",
	legacy_user_missing: "旧ユーザーのアカウント（移行データ）が見つかりません。",
	legacy_user_active: "この旧アカウントは、すでに Google でログインしています。",
	target_invalid: "紐づけ先のアカウントが見つからないか、紐づけできないアカウントです。",
} as const;

/** 運営者画面の共通枠で包んで返す */
const page = (
	c: Context<AdminEnv>,
	title: string,
	current: string | undefined,
	body: Child,
	status: 200 | 409 = 200,
) =>
	c.html(
		<AdminLayout title={title} adminEmail={c.get("adminEmail")} current={current}>
			{body}
		</AdminLayout>,
		status,
	);

/** 運営者画面（E10）。Cloudflare Access の背後に置く */
export function createAdminApp(deps: AdminDeps = {}) {
	const app = new Hono<AdminEnv>();

	app.use(async (c, next) => {
		c.set("requestId", c.req.header("cf-ray") ?? crypto.randomUUID());
		c.set("now", deps.now?.() ?? new Date());
		await next();
	});
	app.use(
		secureHeaders({
			contentSecurityPolicy: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'none'"],
				styleSrc: ["'self'"],
				imgSrc: ["'self'", "data:"],
				formAction: ["'self'"],
				frameAncestors: ["'none'"],
				baseUri: ["'self'"],
				objectSrc: ["'none'"],
			},
			referrerPolicy: "no-referrer",
		}),
	);
	// 運営者画面は誰にもキャッシュさせない
	app.use(async (c, next) => {
		await next();
		c.res.headers.set("Cache-Control", "private, no-store");
	});
	app.use(csrf({ origin: (origin, c) => origin === c.env.ADMIN_ORIGIN }));
	app.use(accessAuth(deps));

	app.get("/", async (c) =>
		page(
			c,
			"ダッシュボード",
			"/",
			<DashboardPage data={await dashboard(c.env.DB, c.get("now"))} />,
		),
	);

	app.get("/search", async (c) => {
		const q = (c.req.query("q") ?? "").trim().slice(0, 100);
		const [users, koudens] = q
			? await Promise.all([searchUsers(c.env.DB, q), searchKoudens(c.env.DB, q)])
			: [[], []];
		return page(c, "検索", "/search", <SearchPage q={q} users={users} koudens={koudens} />);
	});

	app.get("/users/:id", async (c) => {
		const user = await userDetail(c.env.DB, c.req.param("id"));
		if (!user) return c.notFound();
		return page(c, user.displayName, undefined, <UserPage user={user} />);
	});

	app.get("/koudens/:id", async (c) => {
		const kouden = await koudenDetail(c.env.DB, c.req.param("id"));
		if (!kouden) return c.notFound();
		const key = c.req.query("notice");
		const error = c.req.query("error");
		return page(
			c,
			kouden.title,
			undefined,
			<KoudenPage kouden={kouden}>
				<Notice
					notice={key && key in NOTICES ? NOTICES[key as keyof typeof NOTICES] : undefined}
					error={
						error === "already_paid"
							? "すでに有料です。"
							: error === "already_refunded"
								? "すでに取り消し済みです。"
								: error === "reason"
									? "理由を入力してください。"
									: undefined
					}
				/>
			</KoudenPage>,
		);
	});

	app.post("/koudens/:id/grant", async (c) => {
		const koudenId = c.req.param("id");
		const reason = await reasonOf(c.req.parseBody());
		if (!reason) return c.redirect(`/koudens/${koudenId}?error=reason`, 303);
		const result = await grantPaid(
			c.env.DB,
			{ koudenId, reason, adminEmail: c.get("adminEmail") },
			c.get("now"),
		);
		if (!result.ok) {
			if (result.reason === "not_found") return c.notFound();
			return c.redirect(`/koudens/${koudenId}?error=${result.reason}`, 303);
		}
		log("info", "admin_grant_paid", { koudenId, admin: c.get("adminEmail") });
		return c.redirect(`/koudens/${koudenId}?notice=granted`, 303);
	});

	app.post("/purchases/:id/revoke", async (c) => {
		const purchaseId = c.req.param("id");
		const purchase = await c.env.DB.prepare("SELECT kouden_id FROM purchases WHERE id = ?")
			.bind(purchaseId)
			.first<{ kouden_id: string }>();
		if (!purchase) return c.notFound();
		const back = `/koudens/${purchase.kouden_id}`;
		const reason = await reasonOf(c.req.parseBody());
		if (!reason) return c.redirect(`${back}?error=reason`, 303);
		const result = await revokePurchase(
			c.env.DB,
			{ purchaseId, reason, adminEmail: c.get("adminEmail") },
			c.get("now"),
		);
		if (!result.ok) return c.redirect(`${back}?error=${result.reason}`, 303);
		log("info", "admin_revoke_purchase", { purchaseId, admin: c.get("adminEmail") });
		return c.redirect(
			`${back}?notice=${result.downgraded ? "revoked_downgraded" : "revoked"}`,
			303,
		);
	});

	app.get("/legacy", async (c) => {
		const q = (c.req.query("q") ?? "").trim().slice(0, 100);
		const unlinkedOnly = c.req.query("all") !== "1";
		const rows = await listLegacyUsers(c.env.DB, { q: q || undefined, unlinkedOnly });
		return page(
			c,
			"旧ユーザーの紐づけ",
			"/legacy",
			<LegacyListPage q={q} unlinkedOnly={unlinkedOnly} rows={rows} />,
		);
	});

	app.get("/legacy/:id/link", async (c) => {
		const legacy = await legacyUser(c.env.DB, c.req.param("id"));
		if (!legacy) return c.notFound();
		if (legacy.linkedUserId) return c.redirect(`/users/${legacy.linkedUserId}`);
		const email = (c.req.query("email") ?? "").trim().slice(0, 254);
		const candidates = email ? await linkCandidates(c.env.DB, email) : [];
		return page(
			c,
			"旧アカウントに紐づける",
			"/legacy",
			<LinkPage legacy={legacy} email={email} candidates={candidates} />,
		);
	});

	app.post("/legacy/:id/link", async (c) => {
		const legacyUserId = c.req.param("id");
		const body = await c.req.parseBody();
		const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";
		const result = await linkLegacyUser(
			c.env.DB,
			{ legacyUserId, targetUserId, adminEmail: c.get("adminEmail") },
			c.get("now"),
		);
		if (result.ok) {
			log("info", "admin_link_legacy", { legacyUserId, admin: c.get("adminEmail") });
			return c.redirect(`/users/${result.userId}?notice=linked`, 303);
		}
		const legacy = await legacyUser(c.env.DB, legacyUserId);
		if (!legacy) return c.notFound();
		return page(
			c,
			"旧アカウントに紐づける",
			"/legacy",
			<LinkPage legacy={legacy} email="" candidates={[]} error={LINK_ERRORS[result.reason]} />,
			409,
		);
	});

	app.get("/audit", async (c) =>
		page(c, "監査ログ", "/audit", <AuditPage logs={await auditLogs(c.env.DB)} />),
	);

	app.notFound((c) => c.text("Not Found", 404));
	app.onError((err, c) => {
		if (err instanceof HTTPException) return err.getResponse();
		log("error", "unhandled_error", {
			requestId: c.get("requestId"),
			path: c.req.path,
			error: err.message,
			stack: err.stack,
		});
		return c.text(`Internal Server Error (${c.get("requestId")})`, 500);
	});

	return app;
}

async function reasonOf(body: Promise<Record<string, unknown>>): Promise<string> {
	const reason = (await body).reason;
	return typeof reason === "string" ? reason.trim().slice(0, 200) : "";
}
