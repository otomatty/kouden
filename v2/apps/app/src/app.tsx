import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authRoutes } from "./auth/routes.tsx";
import { accountRoutes } from "./routes/account.tsx";
import { log } from "./lib/logger.ts";
import { requestContext } from "./middleware/request-context.ts";
import { csrfProtection, securityHeaders } from "./middleware/security.ts";
import { session } from "./middleware/session.ts";
import { webhookRoutes } from "./routes/billing.tsx";
import { koudenRoutes } from "./routes/koudens.tsx";
import { internalRoutes } from "./routes/internal.ts";
import { inviteRoutes } from "./routes/members.tsx";
import { pageRoutes } from "./routes/pages.tsx";
import type { AppDeps, AppEnv } from "./types.ts";
import { Layout } from "./views/layout.tsx";
import { ErrorPage } from "./views/pages/error.tsx";

export function createApp(deps: AppDeps = {}) {
	const app = new Hono<AppEnv>();

	app.use(requestContext(deps));
	// 招待トークンを含む URL を参照元として送らない。securityHeaders の後（外側）で上書きする
	app.use("/invite/*", async (c, next) => {
		await next();
		c.res.headers.set("Referrer-Policy", "no-referrer");
	});
	app.use(securityHeaders);
	app.use(csrfProtection);
	app.use(session);

	app.get("/healthz", (c) => c.text("ok"));
	app.route("/", authRoutes(deps));
	app.route("/", pageRoutes);
	app.route("/", accountRoutes);
	app.route("/", koudenRoutes);
	app.route("/", inviteRoutes);
	app.route("/", webhookRoutes);
	app.route("/", internalRoutes(deps));

	app.notFound((c) =>
		c.html(
			<Layout title="ページが見つかりません" user={c.get("user")}>
				<ErrorPage status={404} />
			</Layout>,
			404,
		),
	);

	app.onError((err, c) => {
		// CSRF 検査の 403 などは意図したエラーなので、そのまま返す
		if (err instanceof HTTPException) return err.getResponse();

		const requestId = c.get("requestId");
		log("error", "unhandled_error", {
			requestId,
			path: c.req.path,
			error: err.message,
			stack: err.stack,
		});
		return c.html(
			<Layout title="エラー" user={null}>
				<ErrorPage status={500} requestId={requestId} />
			</Layout>,
			500,
		);
	});

	return app;
}
