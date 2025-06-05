"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDeleteKouden } from "../permissions";

/**
 * 香典帳の削除
 */
export async function deleteKouden(id: string) {
	const hasPermission = await canDeleteKouden(id);
	if (!hasPermission) {
		console.error("[deleteKouden] permission denied");
		throw new Error("削除権限がありません");
	}

	const supabase = createAdminClient();
	const { error } = await supabase.from("koudens").delete().eq("id", id);
	if (error) {
		console.error("[deleteKouden] supabase delete error:", error);
		throw error;
	}

	revalidatePath("/koudens");
}
