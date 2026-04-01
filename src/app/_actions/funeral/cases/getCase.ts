"use server";

import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { FuneralCaseWithDetails } from "@/types/funeral-management";

/**
 * Get a single funeral case by ID with customer details.
 * @param id - The case ID
 */
export async function getCase(id: string): Promise<FuneralCaseWithDetails | null> {
	const supabase = await createClient();

	// 案件情報を取得
	const { data: caseRecord, error: caseError } = await supabase
		.schema("funeral")
		.from("cases")
		.select("*")
		.eq("id", id)
		.single();

	if (caseError) throw caseError;
	if (!caseRecord) return null;

	// 顧客情報を取得（基本情報のみ）
	const { data: customer, error: customerError } = await supabase
		.schema("common")
		.from("customers")
		.select("*")
		.eq("id", caseRecord.customer_id)
		.single();

	if (customerError) {
		logger.warn(
			{
				error: customerError.message,
				code: customerError.code,
				caseId: id,
				customerId: caseRecord.customer_id,
			},
			"Customer not found for case",
		);
	}

	// 顧客詳細情報を別途取得
	let customerDetails;
	if (customer) {
		const { data: details } = await supabase
			.schema("funeral")
			.from("customer_details")
			.select("*")
			.eq("customer_id", customer.id)
			.single();

		// Customer型のdetailsプロパティに合わせて変換
		customerDetails = details
			? {
					...details,
					details_created_at: details.created_at,
					details_updated_at: details.updated_at,
				}
			: undefined;
	}

	// 顧客情報を整形
	const customerWithDetails = customer
		? {
				...customer,
				details: customerDetails,
			}
		: undefined;

	return {
		...caseRecord,
		customer: customerWithDetails,
	};
}
