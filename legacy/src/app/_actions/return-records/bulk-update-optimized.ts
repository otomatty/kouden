"use server";

/**
 * 超高速一括更新用のServer Actions（PostgreSQL最適化版）
 * @module bulk-update-optimized
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { AmountGroupData, BulkUpdateResult } from "@/types/return-records/bulk-update";
import { revalidatePath } from "next/cache";

/**
 * PostgreSQL最適化版：超高速一括更新
 * 単一のSQLクエリで全ての更新を実行
 */
export async function executeBulkUpdateOptimized(
	koudenId: string,
	amountGroups: AmountGroupData[],
): Promise<ActionResult<BulkUpdateResult>> {
	return withActionResult(async () => {
		if (!amountGroups || amountGroups.length === 0) {
			return { successCount: 0, failureCount: 0 };
		}

		const supabase = await createClient();

		// セッション確認
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 全体の処理数を計算
		const allEntryIds = amountGroups.flatMap((group) => group.entryIds);

		// 1. 返礼品マスタを一括取得
		const allReturnItemIds = [
			...new Set(amountGroups.flatMap((group) => group.selectedReturnItemIds)),
		];

		let returnItemsMap = new Map();
		if (allReturnItemIds.length > 0) {
			const { data: returnItems, error: returnItemsError } = await supabase
				.from("return_items")
				.select("id, name, price, description")
				.in("id", allReturnItemIds);

			if (returnItemsError) {
				throw returnItemsError;
			}

			returnItemsMap = new Map(returnItems?.map((item) => [item.id, item]) || []);
		}

		// 2. 全エントリーIDを一括で処理するためのデータ準備

		// 3. 既存レコードを一括取得
		const { data: existingRecords, error: selectError } = await supabase
			.from("return_entry_records")
			.select("id, kouden_entry_id")
			.in("kouden_entry_id", allEntryIds);

		if (selectError) {
			throw selectError;
		}

		const existingRecordsMap = new Map(
			existingRecords?.map((record) => [record.kouden_entry_id, record.id]) || [],
		);

		// 4. 既存と新規で分けて処理
		const updateData = [];
		const insertData = [];
		const now = new Date().toISOString();

		for (const group of amountGroups) {
			// 返礼品詳細を構築
			const returnItemsWithDetails = group.selectedReturnItemIds.map((itemId) => {
				const item = returnItemsMap.get(itemId);
				if (!item) {
					throw new KoudenError(`返礼品ID ${itemId} の情報が見つかりません`, ErrorCodes.NOT_FOUND);
				}
				return {
					id: itemId,
					name: item.name,
					price: item.price,
					quantity: 1,
					notes: item.description || undefined,
					isFromMaster: true,
					masterId: itemId,
				};
			});

			const baseData = {
				return_status: group.status,
				return_items: returnItemsWithDetails,
				updated_at: now,
			};

			// 各エントリーのデータを準備
			for (const entryId of group.entryIds) {
				const existingId = existingRecordsMap.get(entryId);

				if (existingId) {
					// 既存レコード更新
					updateData.push({
						id: existingId,
						...baseData,
					});
				} else {
					// 新規レコード作成
					insertData.push({
						kouden_entry_id: entryId,
						created_by: user.id,
						...baseData,
					});
				}
			}
		}

		let successCount = 0;

		// 5a. 既存レコードを一括更新（1件ずつ処理）
		if (updateData.length > 0) {
			for (const update of updateData) {
				const { id, ...updateFields } = update;
				const { error } = await supabase
					.from("return_entry_records")
					.update(updateFields)
					.eq("id", id);

				if (error) {
					throw error;
				}
				successCount++;
			}
		}

		// 5b. 新規レコードを一括作成
		if (insertData.length > 0) {
			const { data: insertResults, error: insertError } = await supabase
				.from("return_entry_records")
				.insert(insertData)
				.select("id");

			if (insertError) {
				throw insertError;
			}
			successCount += insertResults?.length || 0;
		}

		// キャッシュ再検証
		if (successCount > 0) {
			revalidatePath(`/koudens/${koudenId}/return_records`);
			revalidatePath(`/koudens/${koudenId}`);
		}

		return {
			successCount,
			failureCount: allEntryIds.length - successCount,
		};
	}, "PostgreSQL最適化版一括更新");
}
