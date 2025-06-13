"use server";

/**
 * 返礼情報に関するServer Actions
 * @module return-records
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnEntryRecord,
	ReturnStatus,
	CreateReturnEntryInput,
	UpdateReturnEntryInput,
} from "@/types/return-records/return-records";

/**
 * 返礼情報を作成する
 * @param {CreateReturnEntryInput} input - 作成する返礼情報
 * @returns {Promise<ReturnEntryRecord>} 作成された返礼情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnEntry(input: CreateReturnEntryInput): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.insert({
				kouden_entry_id: input.kouden_entry_id,
				return_status: input.return_status || "PENDING",
				return_items: JSON.parse(JSON.stringify(input.return_items || [])),
				funeral_date: input.funeral_date,
				notes: input.notes,
				created_by: session.user.id,
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
		const entryData = await supabase
			.from("kouden_entries")
			.select("kouden_id")
			.eq("id", input.kouden_entry_id)
			.single();

		if (entryData.data) {
			revalidatePath(`/koudens/${entryData.data.kouden_id}`);
		}

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
		const supabase = await createClient();

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
		const supabase = await createClient();

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
 * 返礼情報を更新する
 * @param {UpdateReturnEntryInput & { kouden_id: string }} input - 更新する返礼情報
 * @returns {Promise<ReturnEntryRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnEntry(
	input: UpdateReturnEntryInput & { kouden_id: string },
): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { kouden_entry_id, kouden_id, ...updateData } = input;

		if (!kouden_entry_id) {
			throw new Error("香典エントリーIDが指定されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.update({
				...updateData,
				return_items: updateData.return_items
					? JSON.parse(JSON.stringify(updateData.return_items))
					: undefined,
			})
			.eq("kouden_entry_id", kouden_entry_id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼情報の更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報の更新エラー:", error);
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
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

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
 * 返礼情報のステータスを更新する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {ReturnStatus} status - 新しいステータス
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnEntryRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnEntryStatus(
	koudenEntryId: string,
	status: ReturnStatus,
	koudenId: string,
): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.update({ return_status: status })
			.eq("kouden_entry_id", koudenEntryId)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼情報のステータス更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報のステータス更新エラー:", error);
		throw error;
	}
}
