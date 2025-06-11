import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of reservations.
 * 予約の一覧を取得します。
 *
 * @returns Array of reservations.
 */
export async function listReservations() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("funeral").from("reservations").select("*");
	if (error) throw error;
	return data;
}
