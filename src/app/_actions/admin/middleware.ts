import { ErrorCodes, KoudenError } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAuditLog } from "./audit-logs";

export async function withAdmin<T>(action: () => Promise<T>): Promise<T> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.id) {
		redirect("/auth/login");
	}

	const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	// RPC 自体が失敗した場合は権限不足ではなく DB エラーとして扱う
	if (rpcError) {
		logger.error(
			{ error: rpcError.message, code: rpcError.code, userId: user.id },
			"is_admin RPC failed in withAdmin",
		);
		throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (!isAdmin) {
		redirect("/");
	}

	try {
		const result = await action();
		return result;
	} catch (error) {
		// エラーが発生した場合は監査ログに記録
		if (error instanceof Error) {
			// `createAuditLog` は ActionResult を返すため `.catch` ではなく
			// `result.ok` を確認する。これがないと監査ログの書き込み失敗が
			// サイレントに握りつぶされてしまう。
			try {
				const auditResult = await createAuditLog({
					action: "error",
					target_type: "admin",
					target_id: user.id,
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
							userId: user.id,
						},
						"監査ログの記録に失敗",
					);
				}
			} catch (auditErr) {
				logger.error(
					{
						error: auditErr instanceof Error ? auditErr.message : String(auditErr),
						userId: user.id,
					},
					"監査ログの記録に失敗",
				);
			}
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

	const { data: adminUser } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", user.id)
		.single();

	if (!adminUser || adminUser.role !== "super_admin") {
		redirect("/");
	}

	try {
		const result = await action();
		return result;
	} catch (error) {
		if (error instanceof Error) {
			try {
				const auditResult = await createAuditLog({
					action: "error",
					target_type: "admin",
					target_id: user.id,
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
							userId: user.id,
						},
						"監査ログの記録に失敗",
					);
				}
			} catch (auditErr) {
				logger.error(
					{
						error: auditErr instanceof Error ? auditErr.message : String(auditErr),
						userId: user.id,
					},
					"監査ログの記録に失敗",
				);
			}
		}
		throw error;
	}
}
