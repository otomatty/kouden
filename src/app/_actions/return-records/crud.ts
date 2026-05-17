"use server";

/**
 * 返礼情報の基本CRUD操作
 * @module return-records/crud
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import type {
	CreateReturnEntryInput,
	ReturnEntryRecord,
} from "@/types/return-records/return-records";
import { revalidatePath } from "next/cache";
import { getAuthenticatedClient, getKoudenIdFromEntry } from "./utils";

/**
 * 返礼情報を作成する
 */
export async function createReturnEntry(
	input: CreateReturnEntryInput,
): Promise<ActionResult<ReturnEntryRecord>> {
	return withActionResult(async () => {
		const { supabase, user } = await getAuthenticatedClient();

		const { data, error } = await supabase
			.from("return_entry_records")
			.insert({
				kouden_entry_id: input.kouden_entry_id,
				return_status: input.return_status || "PENDING",
				return_items: JSON.parse(JSON.stringify(input.return_items || [])),
				funeral_date: input.funeral_date,
				remarks: input.remarks,
				created_by: user.id,
			})
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼情報の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		// キャッシュの再検証
		const koudenId = await getKoudenIdFromEntry(input.kouden_entry_id);
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnEntryRecord;
	}, "返礼情報の作成");
}

/**
 * 香典エントリーIDに紐づく返礼情報を取得する
 */
export async function getReturnEntryRecord(
	koudenEntryId: string,
): Promise<ActionResult<ReturnEntryRecord | null>> {
	return withActionResult(async () => {
		const { supabase } = await getAuthenticatedClient();

		const { data, error } = await supabase
			.from("return_entry_records")
			.select("*")
			.eq("kouden_entry_id", koudenEntryId)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 = not found
			throw error;
		}

		return data as ReturnEntryRecord | null;
	}, "返礼情報の取得");
}

/**
 * 香典帳IDに紐づく全ての返礼情報を取得する
 */
export async function getReturnEntriesByKouden(
	koudenId: string,
): Promise<ActionResult<ReturnEntryRecord[]>> {
	return withActionResult(async () => {
		const { supabase } = await getAuthenticatedClient();

		const { data, error } = await supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnEntryRecord[];
	}, "返礼情報一覧の取得");
}

/**
 * 返礼情報を削除する
 */
export async function deleteReturnEntry(
	koudenEntryId: string,
	koudenId: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await getAuthenticatedClient();

		const { error } = await supabase
			.from("return_entry_records")
			.delete()
			.eq("kouden_entry_id", koudenEntryId);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "返礼情報の削除");
}

/**
 * 複数の返礼記録を一括削除する
 */
export async function deleteReturnRecords(
	returnRecordIds: string[],
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await getAuthenticatedClient();

		if (!returnRecordIds.length) {
			throw new KoudenError(
				"削除対象のIDが指定されていません",
				ErrorCodes.INVALID_INPUT,
			);
		}

		// 削除前に関連する香典帳IDを取得（キャッシュ再検証用）
		const { data: koudenIds } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.in("id", returnRecordIds);

		// 一括削除実行
		const { error } = await supabase
			.from("return_entry_records")
			.delete()
			.in("id", returnRecordIds);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (koudenIds) {
			const uniqueKoudenIds = [
				...new Set(koudenIds.map((item) => item.kouden_entries.kouden_id)),
			];
			for (const koudenId of uniqueKoudenIds) {
				revalidatePath(`/koudens/${koudenId}`);
			}
		}

		return null;
	}, "返礼記録の一括削除");
}
