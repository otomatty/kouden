import { createClient } from "@/lib/supabase/server";

/**
 * Create a new quote for a funeral case.
 * @param data - Details of the quote to create
 */
export async function createQuote(data: {
	organizationId: string;
	caseId: string;
	totalAmount: number;
	pdfUrl?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: quote, error } = await supabase
		.schema("funeral")
		.from("quotes")
		.insert({
			organization_id: data.organizationId,
			case_id: data.caseId,
			total_amount: data.totalAmount,
			pdf_url: data.pdfUrl,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return quote;
}
