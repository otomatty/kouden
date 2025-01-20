import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAuditLog } from "./audit-logs";

export async function withAdmin<T>(action: () => Promise<T>): Promise<T> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.id) {
		redirect("/login");
	}

	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (!isAdmin) {
		redirect("/");
	}

	try {
		const result = await action();
		return result;
	} catch (error) {
		// エラーが発生した場合は監査ログに記録
		if (error instanceof Error) {
			await createAuditLog({
				action: "error",
				target_type: "admin",
				target_id: user.id,
				details: {
					error: error.message,
					stack: error.stack,
				},
			}).catch(console.error); // 監査ログの記録に失敗してもメインの処理には影響を与えない
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
		redirect("/login");
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
			await createAuditLog({
				action: "error",
				target_type: "admin",
				target_id: user.id,
				details: {
					error: error.message,
					stack: error.stack,
				},
			}).catch(console.error);
		}
		throw error;
	}
}
