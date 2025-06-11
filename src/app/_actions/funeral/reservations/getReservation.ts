import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single reservation by ID.
 * ID を指定して単一の予約を取得します。
 *
 * @param id - The reservation ID.
 */
export async function getReservation(id: string) {
	const supabase = await createClient();
	const { data: reservation, error } = await supabase
		.schema("funeral")
		.from("reservations")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return reservation;
}
