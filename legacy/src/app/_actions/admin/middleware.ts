import { requireAdmin } from "@/app/_actions/admin/permissions";
import { ErrorCodes, KoudenError } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAuditLog } from "./audit-logs";

/**
 * 管理者アクションのエラーを監査ログに記録する。
 * `createAuditLog` は ActionResult を返すため `.catch` ではなく `result.ok` を確認する。
 */
async function recordAdminErrorAudit(userId: string, error: Error): Promise<void> {
	try {
		const auditResult = await createAuditLog({
			action: "error",
			target_type: "admin",
			target_id: userId,
			details: {
				error: error.message,
				stack: error.stack,
			},
		});
		if (!auditResult.ok) {
			logger.error(
				{
					error: auditResult.error.message,
					code: auditResult.error.code,
					userId,
				},
				"監査ログの記録に失敗",
			);
		}
	} catch (auditErr) {
		logger.error(
			{
				error: auditErr instanceof Error ? auditErr.message : String(auditErr),
				userId,
			},
			"監査ログの記録に失敗",
		);
	}
}

export async function withAdmin<T>(action: () => Promise<T>): Promise<T> {
	const { user } = await requireAdmin();

	try {
		const result = await action();
		return result;
	} catch (error) {
		if (error instanceof Error) {
			await recordAdminErrorAudit(user.id, error);
		}
		throw error;
	}
}

export async function withSuperAdmin<T>(action: () => Promise<T>): Promise<T> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.id) {
		redirect("/auth/login");
	}

	const { data: adminUser, error: adminError } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", user.id)
		.single();

	// PGRST116 (0 行) は「管理者未登録」= 権限不足。それ以外は DB エラーなので
	// 権限不足 (redirect) ではなく DB エラーとして扱う (上位で 500 化)。
	if (adminError && adminError.code !== "PGRST116") {
		logger.error(
			{
				error: adminError.message,
				code: adminError.code,
				details: adminError.details,
				userId: user.id,
			},
			"admin_users lookup failed in withSuperAdmin",
		);
		throw new KoudenError("スーパー管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR, {
			cause: adminError,
		});
	}

	if (!adminUser || adminUser.role !== "super_admin") {
		redirect("/");
	}

	try {
		const result = await action();
		return result;
	} catch (error) {
		if (error instanceof Error) {
			await recordAdminErrorAudit(user.id, error);
		}
		throw error;
	}
}
