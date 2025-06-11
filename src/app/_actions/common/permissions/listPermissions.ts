import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of permissions.
 * 権限の一覧を取得します。
 *
 * @returns Array of permissions.
 */
export async function listPermissions() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("common").from("permissions").select("*");
	if (error) throw error;
	return data;
}
