import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of support tickets.
 * サポートチケットの一覧を取得します。
 *
 * @returns Array of support tickets.
 */
export async function listSupportTickets() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("support_tickets").select("*");
	if (error) throw error;
	return data;
}
