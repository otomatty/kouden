import { createClient } from "@/lib/supabase/server";

/**
 * Create a new invoice.
 * 新しい請求書を作成します。
 *
 * @param data - Object containing organizationId, caseId, amount, dueDate?, paidAt?, status?.
 */
export async function createInvoice(data: {
	organizationId: string;
	caseId: string;
	amount: number;
	dueDate?: string;
	paidAt?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: invoice, error } = await supabase
		.schema("funeral")
		.from("invoices")
		.insert({
			organization_id: data.organizationId,
			case_id: data.caseId,
			amount: data.amount,
			due_date: data.dueDate,
			paid_at: data.paidAt,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return invoice;
}
