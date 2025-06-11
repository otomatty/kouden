import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of invoices.
 * 請求書の一覧を取得します。
 *
 * @returns Array of invoices.
 */
export async function listInvoices() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("funeral").from("invoices").select("*");
	if (error) throw error;
	return data;
}
