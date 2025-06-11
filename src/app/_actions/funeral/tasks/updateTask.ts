import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing task by ID.
 * ID を指定して既存のタスクを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateTask(data: {
	id: string;
	assignedTo?: string;
	dueDate?: string;
	status?: string;
}) {
	const { id, assignedTo, dueDate, status } = data;
	const supabase = await createClient();
	const { data: task, error } = await supabase
		.schema("funeral")
		.from("tasks")
		.update({
			...(assignedTo !== undefined && { assigned_to: assignedTo }),
			...(dueDate !== undefined && { due_date: dueDate }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return task;
}
