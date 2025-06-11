import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single task by ID.
 * ID を指定して単一のタスクを取得します。
 *
 * @param id - The task ID.
 */
export async function getTask(id: string) {
	const supabase = await createClient();
	const { data: task, error } = await supabase
		.schema("funeral")
		.from("tasks")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return task;
}
