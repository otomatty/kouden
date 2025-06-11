import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single support ticket by ID.
 * ID を指定して単一のサポートチケットを取得します。
 *
 * @param id - The support ticket ID.
 */
export async function getSupportTicket(id: string) {
	const supabase = await createClient();
	const { data: ticket, error } = await supabase
		.schema("gift")
		.from("support_tickets")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return ticket;
}
