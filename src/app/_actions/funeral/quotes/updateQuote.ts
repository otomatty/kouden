import { createClient } from "@/lib/supabase/server";

/**
 * Update fields of a quote.
 * @param data - Object containing id and fields to update
 */
export async function updateQuote(data: {
	id: string;
	totalAmount?: number;
	pdfUrl?: string;
	status?: string;
}) {
	const { id, totalAmount, pdfUrl, status } = data;
	const supabase = await createClient();
	const { data: quote, error } = await supabase
		.schema("funeral")
		.from("quotes")
		.update({
			...(totalAmount !== undefined && { total_amount: totalAmount }),
			...(pdfUrl !== undefined && { pdf_url: pdfUrl }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return quote;
}
