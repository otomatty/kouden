import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single invoice by ID.
 * ID を指定して単一の請求書を取得します。
 *
 * @param id - The invoice ID.
 */
export async function getInvoice(id: string) {
	const supabase = await createClient();
	const { data: invoice, error } = await supabase
		.schema("funeral")
		.from("invoices")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return invoice;
}
