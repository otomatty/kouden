"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UpdateCustomerInput } from "@/types/funeral-management";

/**
 * 顧客情報を更新する
 * common.customers と funeral.customer_details を両方更新
 */
export async function updateCustomer(input: UpdateCustomerInput) {
	try {
		const supabase = await createClient();

		// 基本情報の更新（変更がある場合のみ）
		const basicInfo: Record<string, string | null | undefined> = {};
		if (input.name !== undefined) basicInfo.name = input.name;
		if (input.email !== undefined) basicInfo.email = input.email;
		if (input.phone !== undefined) basicInfo.phone = input.phone;

		if (Object.keys(basicInfo).length > 0) {
			const { error: customerError } = await supabase
				.schema("common")
				.from("customers")
				.update(basicInfo)
				.eq("id", input.id);

			if (customerError) {
				console.error("顧客基本情報更新エラー:", customerError);
				return {
					success: false,
					error: "顧客の基本情報の更新に失敗しました",
				};
			}
		}

		// 詳細情報の更新
		const detailsInfo: Record<string, string | null | undefined> = {};
		if (input.address !== undefined) detailsInfo.address = input.address;
		if (input.religion !== undefined) detailsInfo.religion = input.religion;
		if (input.allergy !== undefined) detailsInfo.allergy = input.allergy;
		if (input.registration_date !== undefined)
			detailsInfo.registration_date = input.registration_date;
		if (input.last_contact_date !== undefined)
			detailsInfo.last_contact_date = input.last_contact_date;
		if (input.notes !== undefined) detailsInfo.notes = input.notes;
		if (input.status !== undefined) detailsInfo.status = input.status;

		if (Object.keys(detailsInfo).length > 0) {
			// まず詳細情報が存在するか確認
			const { data: existingDetails } = await supabase
				.schema("funeral")
				.from("customer_details")
				.select("id")
				.eq("customer_id", input.id)
				.single();

			if (existingDetails) {
				// 既存の詳細情報を更新
				const { error: detailsError } = await supabase
					.schema("funeral")
					.from("customer_details")
					.update(detailsInfo)
					.eq("customer_id", input.id);

				if (detailsError) {
					console.error("顧客詳細情報更新エラー:", detailsError);
					return {
						success: false,
						error: "顧客の詳細情報の更新に失敗しました",
					};
				}
			} else {
				// 詳細情報が存在しない場合は新規作成
				// 組織IDは顧客の基本情報から取得
				const { data: customer } = await supabase
					.schema("common")
					.from("customers")
					.select("organization_id")
					.eq("id", input.id)
					.single();

				if (!customer?.organization_id) {
					return {
						success: false,
						error: "顧客の組織情報が見つかりません",
					};
				}

				const { error: detailsError } = await supabase
					.schema("funeral")
					.from("customer_details")
					.insert({
						customer_id: input.id,
						organization_id: customer.organization_id,
						...detailsInfo,
					});

				if (detailsError) {
					console.error("顧客詳細情報作成エラー:", detailsError);
					return {
						success: false,
						error: "顧客の詳細情報の作成に失敗しました",
					};
				}
			}
		}

		// キャッシュを更新
		revalidatePath("/funeral-management/customers");
		revalidatePath(`/funeral-management/customers/${input.id}`);

		return {
			success: true,
		};
	} catch (error) {
		console.error("顧客更新中の予期しないエラー:", error);
		return {
			success: false,
			error: "システムエラーが発生しました",
		};
	}
}
