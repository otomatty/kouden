import { createClient } from "@/lib/supabase/server";

/**
 * Create a new task.
 * 新しいタスクを作成します。
 *
 * @param data - Object containing organizationId, caseId, assignedTo, dueDate?, status?.
 */
export async function createTask(data: {
	organizationId: string;
	caseId: string;
	assignedTo: string;
	dueDate?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: task, error } = await supabase
		.schema("funeral")
		.from("tasks")
		.insert({
			organization_id: data.organizationId,
			case_id: data.caseId,
			assigned_to: data.assignedTo,
			due_date: data.dueDate,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return task;
}
