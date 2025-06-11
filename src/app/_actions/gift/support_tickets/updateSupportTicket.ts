import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing support ticket by ID.
 * ID を指定して既存のサポートチケットを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateSupportTicket(data: {
	id: string;
	subject?: string;
	message?: string;
	status?: string;
}) {
	const { id, subject, message, status } = data;
	const supabase = await createClient();
	const { data: ticket, error } = await supabase
		.schema("gift")
		.from("support_tickets")
		.update({
			...(subject !== undefined && { subject }),
			...(message !== undefined && { message }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return ticket;
}
