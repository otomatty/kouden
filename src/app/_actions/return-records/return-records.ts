"use server";

/**
 * 返礼情報に関するServer Actions
 * @module return-records
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnRecord,
	ReturnRecordStatus,
	CreateReturnRecordInput,
	UpdateReturnRecordInput,
} from "@/types/return-records/return-records";

/**
 * 返礼情報を作成する
 * @param {CreateReturnRecordInput} input - 作成する返礼情報
 * @returns {Promise<ReturnRecord>} 作成された返礼情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnRecord(input: CreateReturnRecordInput): Promise<ReturnRecord> {
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
			.from("return_records")
			.insert({
				...input,
				total_amount: 0, // 初期値は0、後で返礼品詳細が追加された時に更新
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
		revalidatePath(`/koudens/${input.kouden_id}`);

		return data as ReturnRecord;
	} catch (error) {
		console.error("返礼情報の作成エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく返礼情報一覧を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnRecord[]>} 返礼情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecords(koudenId: string): Promise<ReturnRecord[]> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_records")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnRecord[];
	} catch (error) {
		console.error("返礼情報一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を取得する
 * @param {string} id - 返礼情報ID
 * @returns {Promise<ReturnRecord | null>} 返礼情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecord(id: string): Promise<ReturnRecord | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase.from("return_records").select("*").eq("id", id).single();

		if (error) {
			throw error;
		}

		return data as ReturnRecord | null;
	} catch (error) {
		console.error("返礼情報の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を更新する
 * @param {UpdateReturnRecordInput & { kouden_id: string }} input - 更新する返礼情報
 * @returns {Promise<ReturnRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecord(
	input: UpdateReturnRecordInput & { kouden_id: string },
): Promise<ReturnRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { id, kouden_id, ...updateData } = input;

		// 完了日の自動設定
		if (updateData.status === "completed" && !updateData.completed_date) {
			updateData.completed_date = new Date().toISOString().split("T")[0];
		}

		const { data, error } = await supabase
			.from("return_records")
			.update(updateData)
			.eq("id", id)
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

		return data as ReturnRecord;
	} catch (error) {
		console.error("返礼情報の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を削除する
 * @param {string} id - 返礼情報ID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnRecord(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { error } = await supabase.from("return_records").delete().eq("id", id);

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
 * @param {string} id - 返礼情報ID
 * @param {ReturnRecordStatus} status - 新しいステータス
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordStatus(
	id: string,
	status: ReturnRecordStatus,
	koudenId: string,
): Promise<ReturnRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const updateData: {
			status: ReturnRecordStatus;
			completed_date?: string | null;
		} = {
			status,
		};

		// 完了ステータスの場合、完了日を自動設定
		if (status === "completed") {
			updateData.completed_date = new Date().toISOString().split("T")[0];
		}

		const { data, error } = await supabase
			.from("return_records")
			.update(updateData)
			.eq("id", id)
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

		return data as ReturnRecord;
	} catch (error) {
		console.error("返礼情報のステータス更新エラー:", error);
		throw error;
	}
}
