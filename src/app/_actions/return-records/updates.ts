"use server";

/**
 * 返礼情報の更新操作
 * @module return-records/updates
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
	ReturnEntryRecord,
	ReturnStatus,
	UpdateReturnEntryInput,
} from "@/types/return-records/return-records";
import { revalidatePath } from "next/cache";

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
 */
export async function updateReturnEntry(
	input: UpdateReturnEntryInput & { kouden_id: string },
): Promise<ActionResult<ReturnEntryRecord>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		const { kouden_entry_id, kouden_id, ...updateData } = input;

		if (!kouden_entry_id) {
			throw new KoudenError("香典エントリーIDが指定されていません", ErrorCodes.INVALID_INPUT);
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
			throw new KoudenError("返礼情報の更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data as ReturnEntryRecord;
	}, "返礼情報の更新");
}

/**
 * 返礼情報のステータスを更新する
 */
export async function updateReturnEntryStatus(
	koudenEntryId: string,
	status: ReturnStatus,
	koudenId: string,
): Promise<ActionResult<ReturnEntryRecord>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
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
			throw new KoudenError("返礼情報のステータス更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnEntryRecord;
	}, "返礼情報のステータス更新");
}

/**
 * 返礼記録の特定フィールドを更新する
 */
export async function updateReturnRecordField(
	returnRecordId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
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
			throw new KoudenError(`フィールド '${fieldName}' は更新できません`, ErrorCodes.INVALID_INPUT);
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

		return null;
	}, "返礼記録フィールドの更新");
}

/**
 * 香典エントリーIDベースで返礼記録の特定フィールドを更新する
 */
export async function updateReturnRecordFieldByKoudenEntryId(
	koudenEntryId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
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
			throw new KoudenError(`フィールド '${fieldName}' は更新できません`, ErrorCodes.INVALID_INPUT);
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

		return null;
	}, "返礼記録フィールドの更新");
}
