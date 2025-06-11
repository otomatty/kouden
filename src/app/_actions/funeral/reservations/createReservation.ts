import { createClient } from "@/lib/supabase/server";

/**
 * Create a new reservation.
 * 新しい予約を作成します。
 *
 * @param data - Object containing organizationId, customerId, date, status?.
 */
export async function createReservation(data: {
	organizationId: string;
	customerId: string;
	date: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: reservation, error } = await supabase
		.schema("funeral")
		.from("reservations")
		.insert({
			organization_id: data.organizationId,
			customer_id: data.customerId,
			date: data.date,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return reservation;
}
