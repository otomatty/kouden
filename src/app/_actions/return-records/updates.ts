"use server";

/**
 * 返礼情報の更新操作
 * @module return-records/updates
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnEntryRecord,
	ReturnStatus,
	UpdateReturnEntryInput,
} from "@/types/return-records/return-records";

/**
 * 返礼記録の更新可能フィールドの値の型定義
 */
type ReturnRecordFieldValue =
	| ReturnStatus // return_status
	| number // funeral_gift_amount, return_items_cost (additional_return_amountは生成カラムのため除外)
	| string // return_method, arrangement_date, remarks, shipping_postal_code, shipping_address, shipping_phone_number
	| boolean // for compatibility with CellValue type
	| null; // nullable fields

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
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
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
				// additional_return_amountは生成カラムなので除外
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
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
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

/**
 * 返礼記録の特定フィールドを更新する
 * @param {string} returnRecordId - 返礼記録ID
 * @param {string} fieldName - 更新するフィールド名
 * @param {ReturnRecordFieldValue} value - 新しい値
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordField(
	returnRecordId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 更新可能なフィールドのホワイトリスト
		const allowedFields = [
			"return_status",
			"funeral_gift_amount",
			// "additional_return_amount", // 生成カラムのため更新不可
			"return_method",
			"arrangement_date",
			"remarks",
			"shipping_postal_code",
			"shipping_address",
			"shipping_phone_number",
			"return_items_cost",
		];

		if (!allowedFields.includes(fieldName)) {
			throw new Error(`フィールド '${fieldName}' は更新できません`);
		}

		// 更新前に香典帳IDを取得（キャッシュ再検証用）
		const { data: recordData } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("id", returnRecordId)
			.single();

		// フィールド更新実行
		const updateData: Record<string, ReturnRecordFieldValue> = {
			[fieldName]: value,
			updated_at: new Date().toISOString(),
		};

		const { error } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.eq("id", returnRecordId);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (recordData) {
			revalidatePath(`/koudens/${recordData.kouden_entries.kouden_id}`);
		}
	} catch (error) {
		console.error("返礼記録フィールドの更新エラー:", error);
		throw error;
	}
}

/**
 * 香典エントリーIDベースで返礼記録の特定フィールドを更新する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {string} fieldName - 更新するフィールド名
 * @param {ReturnRecordFieldValue} value - 新しい値
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordFieldByKoudenEntryId(
	koudenEntryId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 更新可能なフィールドのホワイトリスト
		const allowedFields = [
			"return_status",
			"funeral_gift_amount",
			// "additional_return_amount", // 生成カラムのため更新不可
			"return_method",
			"arrangement_date",
			"remarks",
			"shipping_postal_code",
			"shipping_address",
			"shipping_phone_number",
			"return_items_cost",
		];

		if (!allowedFields.includes(fieldName)) {
			throw new Error(`フィールド '${fieldName}' は更新できません`);
		}

		// 更新前に香典帳IDを取得（キャッシュ再検証用）
		const { data: recordData } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("kouden_entry_id", koudenEntryId)
			.single();

		// フィールド更新実行
		const updateData: Record<string, ReturnRecordFieldValue> = {
			[fieldName]: value,
			updated_at: new Date().toISOString(),
		};

		const { error } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.eq("kouden_entry_id", koudenEntryId);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (recordData) {
			revalidatePath(`/koudens/${recordData.kouden_entries.kouden_id}`);
		}
	} catch (error) {
		console.error("返礼記録フィールドの更新エラー:", error);
		throw error;
	}
}
