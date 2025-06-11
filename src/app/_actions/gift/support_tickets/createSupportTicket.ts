import { createClient } from "@/lib/supabase/server";

/**
 * Create a new support ticket.
 * 新しいサポートチケットを作成します。
 *
 * @param data - Object containing organizationId, customerId, subject, message, status?.
 */
export async function createSupportTicket(data: {
	organizationId: string;
	customerId: string;
	subject: string;
	message: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: ticket, error } = await supabase
		.schema("gift")
		.from("support_tickets")
		.insert({
			organization_id: data.organizationId,
			customer_id: data.customerId,
			subject: data.subject,
			message: data.message,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return ticket;
}
