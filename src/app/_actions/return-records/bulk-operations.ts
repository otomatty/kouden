"use server";

/**
 * 返礼情報の一括操作
 * @module return-records/bulk-operations
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnManagementSummary,
	BulkUpdateConfig,
	ReturnItem,
	ReturnStatus,
} from "@/types/return-records/return-records";

/**
 * 一括変更用：香典帳の全返礼記録を取得する（ReturnManagementSummary形式）
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnManagementSummary[]>} 全返礼記録のサマリー
 * @throws {Error} 認証エラーまたは取得失敗時のエラー
 */
export async function getAllReturnRecordsForBulkUpdate(
	koudenId: string,
): Promise<ReturnManagementSummary[]> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 全返礼記録を取得（制限なし）
		const { data: returnRecords, error } = await supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					id,
					kouden_id,
					name,
					organization,
					position,
					amount,
					has_offering,
					relationship_id,
					attendance_type
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		// 関係性情報を別途取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name")
			.eq("kouden_id", koudenId);

		if (relationshipsError) {
			throw relationshipsError;
		}

		// ReturnManagementSummary形式に変換
		const summaries: ReturnManagementSummary[] = returnRecords.map((record) => {
			const entry = record.kouden_entries;
			const returnItems: ReturnItem[] = Array.isArray(record.return_items)
				? (record.return_items as unknown as ReturnItem[])
				: [];

			// 関係性名を取得
			const relationship = relationships?.find((r) => r.id === entry.relationship_id);

			return {
				koudenId: koudenId,
				koudenEntryId: record.kouden_entry_id,
				entryName: entry.name || "",
				organization: entry.organization || "",
				entryPosition: entry.position || "",
				relationshipName: relationship?.name || "",
				koudenAmount: entry.amount || 0,
				offeringCount: entry.has_offering ? 1 : 0,
				offeringTotal: entry.has_offering ? 1000 : 0, // 仮の値
				totalAmount: (entry.amount || 0) + (entry.has_offering ? 1000 : 0),
				returnStatus: record.return_status as ReturnStatus,
				funeralGiftAmount: record.funeral_gift_amount || 0,
				additionalReturnAmount: record.additional_return_amount || 0,
				returnMethod: record.return_method || "",
				returnItems: returnItems,
				arrangementDate: record.arrangement_date || "",
				remarks: record.remarks || "",
				returnRecordCreated: record.created_at,
				returnRecordUpdated: record.updated_at,
				statusDisplay: record.return_status,
				needsAdditionalReturn: (record.additional_return_amount || 0) > 0,
				shippingPostalCode: record.shipping_postal_code || undefined,
				shippingAddress: record.shipping_address || undefined,
				shippingPhoneNumber: record.shipping_phone_number || undefined,
				returnItemsCost: record.return_items_cost || 0,
				profitLoss: record.profit_loss || 0,
			} satisfies ReturnManagementSummary;
		});

		return summaries;
	} catch (error) {
		console.error("一括変更用全返礼記録の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼記録の一括更新
 * @param {string} koudenId - 香典帳ID
 * @param {BulkUpdateConfig} config - 一括更新設定
 * @returns {Promise<number>} 更新された件数
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function bulkUpdateReturnRecords(
	koudenId: string,
	config: BulkUpdateConfig,
): Promise<number> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 対象レコードを取得するためのクエリを構築
		let query = supabase
			.from("return_entry_records")
			.select(`
				id,
				kouden_entry_id,
				kouden_entries!inner (
					id,
					amount,
					has_offering,
					relationship_id,
					attendance_type
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId);

		// フィルター条件を適用
		const { filters } = config;

		// 金額範囲フィルター
		if (filters.amountRange) {
			if (filters.amountRange.min !== undefined) {
				query = query.gte("kouden_entries.amount", filters.amountRange.min);
			}
			if (filters.amountRange.max !== undefined) {
				query = query.lte("kouden_entries.amount", filters.amountRange.max);
			}
		}

		// 関係性フィルター
		if (filters.relationshipIds && filters.relationshipIds.length > 0) {
			query = query.in("kouden_entries.relationship_id", filters.relationshipIds);
		}

		// 現在のステータスフィルター
		if (filters.currentStatuses && filters.currentStatuses.length > 0) {
			query = query.in("return_status", filters.currentStatuses);
		}

		// 参列タイプフィルター
		if (filters.attendanceTypes && filters.attendanceTypes.length > 0) {
			query = query.in("kouden_entries.attendance_type", filters.attendanceTypes);
		}

		// お供物の有無フィルター
		if (filters.hasOffering !== undefined) {
			query = query.eq("kouden_entries.has_offering", filters.hasOffering);
		}

		// 対象レコードを取得
		const { data: targetRecords, error: selectError } = await query;

		if (selectError) {
			throw selectError;
		}

		if (!targetRecords || targetRecords.length === 0) {
			return 0;
		}

		// 更新データを構築
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};

		const { updates } = config;

		if (updates.status) {
			updateData.return_status = updates.status;
		}

		if (updates.returnMethod) {
			updateData.return_method = updates.returnMethod;
		}

		if (updates.arrangementDate) {
			updateData.arrangement_date = updates.arrangementDate.toISOString();
		}

		if (updates.remarks) {
			updateData.remarks = updates.remarks;
		}

		// 返礼品の操作
		if (updates.returnItems) {
			// TODO: 返礼品の操作ロジックを実装
			// 現在は基本的なステータス・方法の更新のみ対応
			console.log("返礼品の操作:", updates.returnItems);
		}

		// 一括更新実行
		const targetIds = targetRecords.map((record) => record.id);
		const { error: updateError } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.in("id", targetIds);

		if (updateError) {
			throw updateError;
		}

		// キャッシュを再検証
		revalidatePath(`/koudens/${koudenId}`);

		return targetRecords.length;
	} catch (error) {
		console.error("返礼記録の一括更新エラー:", error);
		throw error;
	}
}
