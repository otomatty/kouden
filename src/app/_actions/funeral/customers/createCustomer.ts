"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateCustomerInput } from "@/types/funeral-management";

/**
 * 新規顧客を作成する
 * common.customers と funeral.customer_details を同時に作成
 */
export async function createCustomer(input: CreateCustomerInput) {
	try {
		const supabase = await createClient();

		// トランザクション的な処理のため、まず基本情報を作成
		const { data: customer, error: customerError } = await supabase
			.schema("common")
			.from("customers")
			.insert({
				name: input.name,
				email: input.email,
				phone: input.phone || null,
				organization_id: input.organization_id,
			})
			.select()
			.single();

		if (customerError) {
			console.error("顧客基本情報作成エラー:", customerError);
			return {
				success: false,
				error: "顧客の基本情報の作成に失敗しました",
			};
		}

		// 詳細情報を作成
		const { error: detailsError } = await supabase
			.schema("funeral")
			.from("customer_details")
			.insert({
				customer_id: customer.id,
				organization_id: input.organization_id,
				address: input.address || null,
				religion: input.religion || null,
				allergy: input.allergy || null,
				registration_date: input.registration_date || new Date().toISOString().split("T")[0],
				last_contact_date: input.last_contact_date || null,
				notes: input.notes || null,
				status: input.status || "アクティブ",
			});

		if (detailsError) {
			console.error("顧客詳細情報作成エラー:", detailsError);
			// 基本情報をロールバック
			await supabase.schema("common").from("customers").delete().eq("id", customer.id);
			return {
				success: false,
				error: "顧客の詳細情報の作成に失敗しました",
			};
		}

		// キャッシュを更新
		revalidatePath("/funeral-management/customers");

		return {
			success: true,
			data: customer,
		};
	} catch (error) {
		console.error("顧客作成中の予期しないエラー:", error);
		return {
			success: false,
			error: "システムエラーが発生しました",
		};
	}
}
