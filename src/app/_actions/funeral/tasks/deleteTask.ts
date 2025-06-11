import { createClient } from "@/lib/supabase/server";

/**
 * Delete a task by ID.
 * ID を指定してタスクを削除します。
 *
 * @param id - The task ID.
 */
export async function deleteTask(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("tasks").delete().eq("id", id);
	if (error) throw error;
	return true;
}
