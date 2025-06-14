"use server";

/**
 * 一括更新用のServer Actions
 * @module bulk-update
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	AmountGroupData,
	ReturnItemMaster,
	BulkUpdateExecutionData,
	BulkUpdateResult,
} from "@/types/return-records/bulk-update";

/**
 * 香典帳の返礼品マスタを取得（一括更新用）
 * @param koudenId - 香典帳ID
 * @returns 返礼品マスタ配列
 */
export async function getReturnItemsForBulkUpdate(koudenId: string): Promise<ReturnItemMaster[]> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_items")
			.select("id, name, price, description, kouden_id")
			.eq("kouden_id", koudenId)
			.order("name", { ascending: true });

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("返礼品マスタの取得エラー:", error);
		throw new Error("返礼品マスタの取得に失敗しました");
	}
}

/**
 * 金額ベースの一括更新を実行
 * @param koudenId - 香典帳ID
 * @param executionData - 実行データ
 * @returns 更新結果
 */
export async function executeBulkUpdateByAmount(
	koudenId: string,
	executionData: BulkUpdateExecutionData,
): Promise<BulkUpdateResult> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		let successCount = 0;
		let failureCount = 0;
		const errors: string[] = [];

		// 各エントリーに対して返礼記録を更新
		for (const entryId of executionData.entryIds) {
			try {
				// 既存の返礼記録を確認
				const { data: existingRecord } = await supabase
					.from("return_entry_records")
					.select("id")
					.eq("kouden_entry_id", entryId)
					.single();

				const updateData = {
					return_status: executionData.status,
					return_method: executionData.returnMethod,
					return_items: executionData.returnItemIds.map((itemId) => ({
						id: itemId,
						quantity: 1, // デフォルト数量
					})),
					updated_at: new Date().toISOString(),
				};

				if (existingRecord) {
					// 既存レコードを更新
					const { error } = await supabase
						.from("return_entry_records")
						.update(updateData)
						.eq("id", existingRecord.id);

					if (error) throw error;
				} else {
					// 新規レコードを作成
					const { error } = await supabase.from("return_entry_records").insert({
						kouden_entry_id: entryId,
						...updateData,
						created_by: user.id,
					});

					if (error) throw error;
				}

				successCount++;
			} catch (error) {
				failureCount++;
				errors.push(
					`エントリーID ${entryId}: ${error instanceof Error ? error.message : "不明なエラー"}`,
				);
			}
		}

		// キャッシュを再検証
		revalidatePath(`/koudens/${koudenId}/return_records`);

		return {
			successCount,
			failureCount,
			errors: errors.length > 0 ? errors : undefined,
		};
	} catch (error) {
		console.error("一括更新の実行エラー:", error);
		throw new Error("一括更新の実行に失敗しました");
	}
}

/**
 * 複数の金額グループを一括更新
 * @param koudenId - 香典帳ID
 * @param amountGroups - 金額グループデータ配列
 * @returns 更新結果
 */
export async function executeBulkUpdateMultipleGroups(
	koudenId: string,
	amountGroups: AmountGroupData[],
): Promise<BulkUpdateResult> {
	try {
		let totalSuccessCount = 0;
		let totalFailureCount = 0;
		const allErrors: string[] = [];

		// 各金額グループを順次処理
		for (const group of amountGroups) {
			const executionData: BulkUpdateExecutionData = {
				entryIds: group.entryIds,
				returnItemIds: group.selectedReturnItemIds,
				status: group.status,
			};

			const result = await executeBulkUpdateByAmount(koudenId, executionData);

			totalSuccessCount += result.successCount;
			totalFailureCount += result.failureCount;

			if (result.errors) {
				allErrors.push(...result.errors);
			}
		}

		return {
			successCount: totalSuccessCount,
			failureCount: totalFailureCount,
			errors: allErrors.length > 0 ? allErrors : undefined,
		};
	} catch (error) {
		console.error("複数グループ一括更新エラー:", error);
		throw new Error("複数グループの一括更新に失敗しました");
	}
}
