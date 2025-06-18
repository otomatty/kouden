"use server";

/**
 * 返礼情報の基本CRUD操作
 * @module return-records/crud
 */

import { revalidatePath } from "next/cache";
import { getAuthenticatedClient, getKoudenIdFromEntry } from "./utils";
import type {
	ReturnEntryRecord,
	CreateReturnEntryInput,
} from "@/types/return-records/return-records";

/**
 * 返礼情報を作成する
 * @param {CreateReturnEntryInput} input - 作成する返礼情報
 * @returns {Promise<ReturnEntryRecord>} 作成された返礼情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnEntry(input: CreateReturnEntryInput): Promise<ReturnEntryRecord> {
	try {
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
			throw new Error("返礼情報の作成に失敗しました");
		}

		// キャッシュの再検証
		const koudenId = await getKoudenIdFromEntry(input.kouden_entry_id);
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報の作成エラー:", error);
		throw error;
	}
}

/**
 * 香典エントリーIDに紐づく返礼情報を取得する
 * @param {string} koudenEntryId - 香典エントリーID
 * @returns {Promise<ReturnEntryRecord | null>} 返礼情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntryRecord(
	koudenEntryId: string,
): Promise<ReturnEntryRecord | null> {
	try {
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
	} catch (error) {
		console.error("返礼情報の取得エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく全ての返礼情報を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnEntryRecord[]>} 返礼情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntriesByKouden(koudenId: string): Promise<ReturnEntryRecord[]> {
	try {
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
	} catch (error) {
		console.error("返礼情報一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を削除する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnEntry(koudenEntryId: string, koudenId: string): Promise<void> {
	try {
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
	} catch (error) {
		console.error("返礼情報の削除エラー:", error);
		throw error;
	}
}

/**
 * 複数の返礼記録を一括削除する
 * @param {string[]} returnRecordIds - 削除する返礼記録のID配列
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnRecords(returnRecordIds: string[]): Promise<void> {
	try {
		const { supabase } = await getAuthenticatedClient();

		if (!returnRecordIds.length) {
			throw new Error("削除対象のIDが指定されていません");
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
			const uniqueKoudenIds = [...new Set(koudenIds.map((item) => item.kouden_entries.kouden_id))];
			for (const koudenId of uniqueKoudenIds) {
				revalidatePath(`/koudens/${koudenId}`);
			}
		}
	} catch (error) {
		console.error("返礼記録の一括削除エラー:", error);
		throw error;
	}
}
