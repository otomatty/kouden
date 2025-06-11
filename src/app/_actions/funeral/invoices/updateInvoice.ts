import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing invoice by ID.
 * ID を指定して既存の請求書を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateInvoice(data: {
	id: string;
	amount?: number;
	dueDate?: string;
	paidAt?: string;
	status?: string;
}) {
	const { id, amount, dueDate, paidAt, status } = data;
	const supabase = await createClient();
	const { data: invoice, error } = await supabase
		.schema("funeral")
		.from("invoices")
		.update({
			...(amount !== undefined && { amount }),
			...(dueDate !== undefined && { due_date: dueDate }),
			...(paidAt !== undefined && { paid_at: paidAt }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return invoice;
}
