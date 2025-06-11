import { createClient } from "@/lib/supabase/server";

/**
 * Delete an invoice by ID.
 * ID を指定して請求書を削除します。
 *
 * @param id - The invoice ID.
 */
export async function deleteInvoice(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("invoices").delete().eq("id", id);
	if (error) throw error;
	return true;
}
