"use server";

/**
 * 返礼情報の一括操作
 * @module return-records/bulk-operations
 */

import { convertToReturnManagementSummaries } from "@/app/_actions/return-records/summaries";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceType, Entry } from "@/types/entries";
import type {
	BulkUpdateConfig,
	ReturnManagementSummary,
} from "@/types/return-records/return-records";
import { revalidatePath } from "next/cache";

/**
 * 一括変更用：香典帳の全返礼記録を取得する（ReturnManagementSummary形式）
 */
export async function getAllReturnRecordsForBulkUpdate(
	koudenId: string,
): Promise<ActionResult<ReturnManagementSummary[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
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
					postal_code,
					address,
					phone_number,
					has_offering,
					relationship_id,
					attendance_type,
					notes,
					created_at,
					updated_at,
					created_by,
					version,
					last_modified_at,
					last_modified_by,
					is_duplicate
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		// 関係性情報を別途取得
		const { data: relationshipsData, error: relationshipsError } = await supabase
			.from("relationships")
			.select("*")
			.eq("kouden_id", koudenId);

		const relationships = relationshipsData || [];

		if (relationshipsError) {
			throw relationshipsError;
		}

		// entriesをEntry型配列に変換
		const entryList: Entry[] = returnRecords.map((record) => ({
			...record.kouden_entries,
			attendanceType: record.kouden_entries.attendance_type as AttendanceType,
			relationshipId: record.kouden_entries.relationship_id,
			// 型に合わせてデフォルト値を設定
			updated_at: record.kouden_entries.updated_at || new Date().toISOString(),
			entry_number: null, // Entry型にentry_numberは存在しないが、とりあえずnullで設定
		}));

		// ReturnManagementSummary形式に変換（実際のお供物配分金額を取得）
		const summariesResult = await convertToReturnManagementSummaries(
			returnRecords,
			entryList,
			relationships,
			koudenId,
		);
		if (!summariesResult.ok) {
			throw new KoudenError(summariesResult.error.message, summariesResult.error.code);
		}

		return summariesResult.data;
	}, "一括変更用全返礼記録の取得");
}

/**
 * 返礼記録の一括更新
 */
export async function bulkUpdateReturnRecords(
	koudenId: string,
	config: BulkUpdateConfig,
): Promise<ActionResult<number>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
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
			logger.info(
				{
					returnItems: updates.returnItems,
					koudenId,
				},
				"返礼品の操作",
			);
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
	}, "返礼記録の一括更新");
}
