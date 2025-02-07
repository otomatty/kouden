/**
 * 返礼品詳細情報に関するServer Actions
 * @module return-record-items
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnRecordItem,
	CreateReturnRecordItemInput,
	UpdateReturnRecordItemInput,
} from "@/types/return-records/return-record-items";

/**
 * 返礼品詳細情報を作成する
 * @param {CreateReturnRecordItemInput} input - 作成する返礼品詳細情報
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnRecordItem>} 作成された返礼品詳細情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnRecordItem(
	input: CreateReturnRecordItemInput,
	koudenId: string,
): Promise<ReturnRecordItem> {
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
			.from("return_record_items")
			.insert({
				...input,
				created_by: session.user.id,
			})
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼品詳細情報の作成に失敗しました");
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(input.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnRecordItem;
	} catch (error) {
		console.error("返礼品詳細情報の作成エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報IDに紐づく返礼品詳細情報一覧を取得する
 * @param {string} returnRecordId - 返礼情報ID
 * @returns {Promise<ReturnRecordItem[]>} 返礼品詳細情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecordItems(returnRecordId: string): Promise<ReturnRecordItem[]> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_record_items")
			.select("*")
			.eq("return_record_id", returnRecordId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnRecordItem[];
	} catch (error) {
		console.error("返礼品詳細情報一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼品詳細情報を取得する
 * @param {string} id - 返礼品詳細情報ID
 * @returns {Promise<ReturnRecordItem | null>} 返礼品詳細情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecordItem(id: string): Promise<ReturnRecordItem | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_record_items")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data as ReturnRecordItem | null;
	} catch (error) {
		console.error("返礼品詳細情報の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼品詳細情報を更新する
 * @param {UpdateReturnRecordItemInput} input - 更新する返礼品詳細情報
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnRecordItem>} 更新された返礼品詳細情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordItem(
	input: UpdateReturnRecordItemInput,
	koudenId: string,
): Promise<ReturnRecordItem> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		// 更新前の情報を取得して返礼情報IDを保持
		const existingItem = await getReturnRecordItem(input.id);
		if (!existingItem) {
			throw new Error("返礼品詳細情報が見つかりません");
		}

		const { id, ...updateData } = input;

		const { data, error } = await supabase
			.from("return_record_items")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼品詳細情報の更新に失敗しました");
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(existingItem.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnRecordItem;
	} catch (error) {
		console.error("返礼品詳細情報の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼品詳細情報を削除する
 * @param {string} id - 返礼品詳細情報ID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnRecordItem(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		// 削除前の情報を取得して返礼情報IDを保持
		const existingItem = await getReturnRecordItem(id);
		if (!existingItem) {
			throw new Error("返礼品詳細情報が見つかりません");
		}

		const { error } = await supabase.from("return_record_items").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(existingItem.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("返礼品詳細情報の削除エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報の合計金額を更新する（内部関数）
 * @param {string} returnRecordId - 返礼情報ID
 * @returns {Promise<void>}
 */
async function updateReturnRecordTotalAmount(returnRecordId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// 返礼品詳細の合計金額を計算
		const { data: items, error: itemsError } = await supabase
			.from("return_record_items")
			.select("price, quantity")
			.eq("return_record_id", returnRecordId);

		if (itemsError) {
			throw itemsError;
		}

		const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		// 返礼情報の合計金額を更新
		const { error: updateError } = await supabase
			.from("return_records")
			.update({ total_amount: totalAmount })
			.eq("id", returnRecordId);

		if (updateError) {
			throw updateError;
		}
	} catch (error) {
		console.error("返礼情報の合計金額更新エラー:", error);
		throw error;
	}
}
