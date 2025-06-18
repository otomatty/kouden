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

// 返礼品マスタのキャッシュ（セッション内で再利用）
const returnItemsCache = new Map<string, ReturnItemMaster[]>();

/**
 * 香典帳の返礼品マスタを取得（一括更新用・キャッシュ対応）
 * @param koudenId - 香典帳ID
 * @returns 返礼品マスタ配列
 */
export async function getReturnItemsForBulkUpdate(koudenId: string): Promise<ReturnItemMaster[]> {
	// キャッシュから取得を試行
	if (returnItemsCache.has(koudenId)) {
		return returnItemsCache.get(koudenId) || [];
	}

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
			console.error("返礼品マスタ取得エラー:", error);
			throw new Error(`返礼品マスタの取得に失敗しました: ${error.message}`);
		}

		const result = data || [];

		// キャッシュに保存
		returnItemsCache.set(koudenId, result);

		return result;
	} catch (error) {
		console.error("返礼品マスタの取得エラー:", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("返礼品マスタの取得に失敗しました");
	}
}

/**
 * 金額ベースの一括更新を実行（改良版：バッチ処理対応）
 * @param koudenId - 香典帳ID
 * @param executionData - 実行データ
 * @returns 更新結果
 */
export async function executeBulkUpdateByAmount(
	// koudenId: string,

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

		// 返礼品マスタを取得して、名前と価格の情報を取得
		let returnItemsMap = new Map<string, ReturnItemMaster>();
		if (executionData.returnItemIds.length > 0) {
			const { data: returnItems, error: returnItemsError } = await supabase
				.from("return_items")
				.select("id, name, price, description, kouden_id")
				.in("id", executionData.returnItemIds);

			if (returnItemsError) {
				console.error("返礼品マスタ取得エラー:", returnItemsError);
				throw new Error(`返礼品情報の取得に失敗しました: ${returnItemsError.message}`);
			}

			returnItemsMap = new Map(returnItems?.map((item) => [item.id, item]) || []);
		}

		// 返礼品情報を構築（IDだけでなく、名前と価格も含める）
		const returnItemsWithDetails = executionData.returnItemIds.map((itemId) => {
			const itemMaster = returnItemsMap.get(itemId);
			if (!itemMaster) {
				throw new Error(`返礼品ID ${itemId} の情報が見つかりません`);
			}
			return {
				id: itemId,
				name: itemMaster.name,
				price: itemMaster.price,
				quantity: 1, // デフォルト数量
				notes: itemMaster.description || undefined,
				isFromMaster: true,
				masterId: itemId,
			};
		});

		// 既存の返礼記録を一括取得
		const { data: existingRecords, error: selectError } = await supabase
			.from("return_entry_records")
			.select("id, kouden_entry_id")
			.in("kouden_entry_id", executionData.entryIds);

		if (selectError) {
			console.error("既存記録取得エラー:", selectError);
			throw new Error(`既存記録の取得に失敗しました: ${selectError.message}`);
		}

		const existingRecordsMap = new Map(
			existingRecords?.map((record) => [record.kouden_entry_id, record.id]) || [],
		);

		// 更新データと新規作成データを分離
		type UpdateData = {
			return_status: string;
			return_method?: string;
			return_items: Array<{
				id: string;
				name: string;
				price: number;
				quantity: number;
				notes?: string;
				isFromMaster: boolean;
				masterId: string;
			}>;
			updated_at: string;
		};

		type InsertData = UpdateData & {
			kouden_entry_id: string;
			created_by: string;
		};

		const updateData: Array<{ id: string; data: UpdateData }> = [];
		const insertData: Array<InsertData> = [];

		const baseData = {
			return_status: executionData.status,
			return_method: executionData.returnMethod || undefined,
			return_items: returnItemsWithDetails,
			updated_at: new Date().toISOString(),
		};

		for (const entryId of executionData.entryIds) {
			const existingRecordId = existingRecordsMap.get(entryId);

			if (existingRecordId) {
				// 既存レコード更新
				updateData.push({
					id: existingRecordId,
					data: baseData,
				});
			} else {
				// 新規レコード作成
				insertData.push({
					kouden_entry_id: entryId,
					...baseData,
					created_by: user.id,
				});
			}
		}

		let successCount = 0;
		let failureCount = 0;
		const errors: string[] = [];

		// バッチ処理で更新実行（既存レコード）
		if (updateData.length > 0) {
			const BATCH_SIZE = 100; // バッチサイズを制限
			for (let i = 0; i < updateData.length; i += BATCH_SIZE) {
				const batch = updateData.slice(i, i + BATCH_SIZE);

				try {
					// 従来の1件ずつ更新に戻す（型安全）
					for (const update of batch) {
						const { error } = await supabase
							.from("return_entry_records")
							.update(update.data)
							.eq("id", update.id);

						if (error) {
							failureCount++;
							errors.push(`更新エラー (ID: ${update.id}): ${error.message}`);
						} else {
							successCount++;
						}
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : "不明なエラー";
					failureCount += batch.length;
					errors.push(`バッチ更新エラー: ${errorMsg}`);
				}
			}
		}

		// バッチ処理で新規作成実行（変更なし - 既に効率的）
		if (insertData.length > 0) {
			const BATCH_SIZE = 100;
			for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
				const batch = insertData.slice(i, i + BATCH_SIZE);

				try {
					const { error } = await supabase.from("return_entry_records").insert(batch);

					if (error) {
						failureCount += batch.length;
						errors.push(`バッチ作成エラー: ${error.message}`);
					} else {
						successCount += batch.length;
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : "不明なエラー";
					failureCount += batch.length;
					errors.push(`バッチ作成エラー: ${errorMsg}`);
				}
			}
		}

		// キャッシュの再検証（ここでは実行しない - 外部で実行）
		// revalidatePath(`/koudens/${koudenId}/return_records`);
		// revalidatePath(`/koudens/${koudenId}`);

		return {
			successCount,
			failureCount,
			errors: errors.length > 0 ? errors : undefined,
		};
	} catch (error) {
		console.error("一括更新の実行エラー:", error);
		const errorMessage = error instanceof Error ? error.message : "不明なエラー";
		throw new Error(`一括更新の実行に失敗しました: ${errorMessage}`);
	}
}

/**
 * 複数の金額グループを一括更新（改良版：並列処理対応）
 * @param koudenId - 香典帳ID
 * @param amountGroups - 金額グループデータ配列
 * @returns 更新結果
 */
export async function executeBulkUpdateMultipleGroups(
	koudenId: string,
	amountGroups: AmountGroupData[],
): Promise<BulkUpdateResult> {
	try {
		if (!amountGroups || amountGroups.length === 0) {
			return {
				successCount: 0,
				failureCount: 0,
			};
		}

		// 返礼品マスタを事前にキャッシュ（全グループで共有）
		await getReturnItemsForBulkUpdate(koudenId);

		// 並列処理で各グループを処理（ただし、同時実行数を制限）
		const CONCURRENT_LIMIT = 5; // 同時実行数を少し増やす（キャッシュ効果で高速化）
		const results: BulkUpdateResult[] = [];

		for (let i = 0; i < amountGroups.length; i += CONCURRENT_LIMIT) {
			const batch = amountGroups.slice(i, i + CONCURRENT_LIMIT);

			const batchPromises = batch.map(async (group) => {
				const executionData: BulkUpdateExecutionData = {
					entryIds: group.entryIds,
					returnItemIds: group.selectedReturnItemIds,
					status: group.status,
				};

				try {
					return await executeBulkUpdateByAmount(executionData);
				} catch (error) {
					console.error(`グループ処理エラー (金額: ${group.amount}):`, error);
					return {
						successCount: 0,
						failureCount: group.count,
						errors: [
							`金額${group.amount}円グループ: ${error instanceof Error ? error.message : "不明なエラー"}`,
						],
					};
				}
			});

			const batchResults = await Promise.all(batchPromises);
			results.push(...batchResults);
		}

		// 結果を集計
		const totalSuccessCount = results.reduce((sum, result) => sum + result.successCount, 0);
		const totalFailureCount = results.reduce((sum, result) => sum + result.failureCount, 0);
		const allErrors = results.flatMap((result) => result.errors || []);

		// 全処理完了後に一度だけキャッシュを再検証
		if (totalSuccessCount > 0) {
			revalidatePath(`/koudens/${koudenId}/return_records`);
			revalidatePath(`/koudens/${koudenId}`);
		}

		return {
			successCount: totalSuccessCount,
			failureCount: totalFailureCount,
			errors: allErrors.length > 0 ? allErrors : undefined,
		};
	} catch (error) {
		console.error("複数グループ一括更新エラー:", error);
		const errorMessage = error instanceof Error ? error.message : "不明なエラー";
		throw new Error(`複数グループの一括更新に失敗しました: ${errorMessage}`);
	}
}
