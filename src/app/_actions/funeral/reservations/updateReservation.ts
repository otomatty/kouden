import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing reservation by ID.
 * ID を指定して既存の予約を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateReservation(data: {
	id: string;
	date?: string;
	status?: string;
}) {
	const { id, date, status } = data;
	const supabase = await createClient();
	const { data: reservation, error } = await supabase
		.schema("funeral")
		.from("reservations")
		.update({
			...(date !== undefined && { date }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return reservation;
}
