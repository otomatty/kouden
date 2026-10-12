import { profileSchema, toFieldErrors } from "@kouden/domain";
import { Hono } from "hono";
import { deleteAccount, membershipsOf, ownedKoudens, updateDisplayName } from "../auth/account.ts";
import { log } from "../lib/logger.ts";
import { clearSessionCookie, requireUser } from "../middleware/session.ts";
import type { AppEnv } from "../types.ts";
import type { FieldErrors } from "@kouden/domain";
import type { FormValues } from "../views/components/form.tsx";
import { Layout } from "../views/layout.tsx";
import { AccountDeletedPage, AccountPage } from "../views/pages/account.tsx";
import { type Ctx, formValues } from "./helpers.tsx";
import { notifyLedger } from "./members.tsx";

/** アカウント（E1-4, E1-5） */
export const accountRoutes = new Hono<AppEnv>();
accountRoutes.use("/account", requireUser);
accountRoutes.use("/account/*", requireUser);

const NOTICES = { saved: "表示名を保存しました。" } as const;

async function renderAccount(
	c: Ctx,
	options: {
		values?: FormValues;
		errors?: FieldErrors;
		deleteError?: string;
		status?: 200 | 409 | 422;
	} = {},
) {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	const key = c.req.query("notice");
	return c.html(
		<Layout title="アカウント" user={user}>
			<AccountPage
				user={user}
				owned={await ownedKoudens(c.env.DB, user.id, c.get("now"))}
				values={options.values ?? { displayName: user.displayName }}
				errors={options.errors}
				notice={key && key in NOTICES ? NOTICES[key as keyof typeof NOTICES] : undefined}
				deleteError={options.deleteError}
			/>
		</Layout>,
		options.status ?? 200,
	);
}

accountRoutes.get("/account", (c) => renderAccount(c));

accountRoutes.post("/account/profile", async (c) => {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	const values = await formValues(c);
	const parsed = profileSchema.safeParse(values);
	if (!parsed.success) {
		return renderAccount(c, { values, errors: toFieldErrors(parsed.error), status: 422 });
	}
	await updateDisplayName(c.env.DB, user.id, parsed.data.displayName, c.get("now"));
	return c.redirect("/account?notice=saved", 303);
});

accountRoutes.post("/account/delete", async (c) => {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	if ((await formValues(c)).confirm !== "1") {
		return renderAccount(c, { deleteError: "確認の欄にチェックを入れてください", status: 422 });
	}
	// 削除後は参加していた香典帳が分からなくなるので、先に控えておく
	const memberships = await membershipsOf(c.env.DB, user.id);
	if (!(await deleteAccount(c.env.DB, user.id, c.get("now")))) {
		return renderAccount(c, {
			deleteError:
				"オーナーである香典帳が残っています。譲渡するか削除してから、もう一度お試しください。",
			status: 409,
		});
	}
	log("info", "account_deleted", { userId: user.id, memberships: memberships.length });
	// 開いている画面の接続を切り、他のメンバーのメンバー一覧を取り直させる
	for (const m of memberships) {
		await notifyLedger(
			c.env,
			{
				koudenId: m.koudenId,
				userId: user.id,
				displayName: user.displayName,
				role: m.role,
				plan: m.plan,
			},
			{ entity: "member", entityId: user.id, op: "delete", diff: null },
			{ revokeUserId: user.id },
		);
	}
	clearSessionCookie(c);
	return c.html(
		<Layout title="アカウントを削除しました" user={null}>
			<AccountDeletedPage />
		</Layout>,
	);
});
