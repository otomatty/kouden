import { createClient } from "@/lib/supabase/server";

/**
 * Delete a reservation by ID.
 * ID を指定して予約を削除します。
 *
 * @param id - The reservation ID.
 */
export async function deleteReservation(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("reservations").delete().eq("id", id);
	if (error) throw error;
	return true;
}
