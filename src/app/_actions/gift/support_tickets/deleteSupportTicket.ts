import { createClient } from "@/lib/supabase/server";

/**
 * Delete a support ticket by ID.
 * ID を指定してサポートチケットを削除します。
 *
 * @param id - The support ticket ID.
 */
export async function deleteSupportTicket(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("support_tickets").delete().eq("id", id);
	if (error) throw error;
	return true;
}
