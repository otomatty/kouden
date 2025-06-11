import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of tasks.
 * タスクの一覧を取得します。
 *
 * @returns Array of tasks.
 */
export async function listTasks() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("funeral").from("tasks").select("*");
	if (error) throw error;
	return data;
}
