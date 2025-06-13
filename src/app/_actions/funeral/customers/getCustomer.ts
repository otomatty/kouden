"use server";

import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/funeral-management";

/**
 * IDで顧客を取得する（詳細情報も含む）
 */
export async function getCustomer(id: string): Promise<{
	success: boolean;
	data?: Customer;
	error?: string;
}> {
	try {
		const supabase = await createClient();

		// 基本情報を取得
		const { data: customer, error: customerError } = await supabase
			.schema("common")
			.from("customers")
			.select("*")
			.eq("id", id)
			.single();

		if (customerError) {
			console.error("顧客基本情報取得エラー:", customerError);
			return {
				success: false,
				error: "顧客が見つかりません",
			};
		}

		// 詳細情報を取得
		const { data: details, error: detailsError } = await supabase
			.schema("funeral")
			.from("customer_details")
			.select("*")
			.eq("customer_id", id)
			.single();

		if (detailsError && detailsError.code !== "PGRST116") {
			console.error("顧客詳細情報取得エラー:", detailsError);
			// 詳細情報がない場合は基本情報のみ返す
		}

		// 結合されたデータを作成
		const result: Customer = {
			...customer,
			details: details
				? {
						id: details.id,
						customer_id: details.customer_id,
						address: details.address,
						religion: details.religion,
						allergy: details.allergy,
						registration_date: details.registration_date,
						last_contact_date: details.last_contact_date,
						notes: details.notes,
						status: details.status,
						details_created_at: details.created_at,
						details_updated_at: details.updated_at,
					}
				: undefined,
		};

		return {
			success: true,
			data: result,
		};
	} catch (error) {
		console.error("顧客取得中の予期しないエラー:", error);
		return {
			success: false,
			error: "システムエラーが発生しました",
		};
	}
}
