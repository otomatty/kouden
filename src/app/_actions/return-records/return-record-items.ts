"use server";

/**
 * 返礼品詳細情報に関するServer Actions
 * @module return-record-items
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type {
	CreateReturnRecordItemInput,
	ReturnRecordItem,
	UpdateReturnRecordItemInput,
} from "@/types/return-records/return-record-items";
import { revalidatePath } from "next/cache";

/**
 * 返礼品詳細情報を作成する
 */
export async function createReturnRecordItem(
	input: CreateReturnRecordItemInput,
	koudenId: string,
): Promise<ActionResult<ReturnRecordItem>> {
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
			.from("return_record_items")
			.insert({
				...input,
				created_by: user.id,
			})
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼品詳細情報の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(input.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnRecordItem;
	}, "返礼品詳細情報の作成");
}

/**
 * 返礼情報IDに紐づく返礼品詳細情報一覧を取得する
 */
export async function getReturnRecordItems(
	returnRecordId: string,
): Promise<ActionResult<ReturnRecordItem[]>> {
	return withActionResult(async () => {
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
	}, "返礼品詳細情報一覧の取得");
}

/**
 * 内部用: 返礼品詳細情報を取得する（throws）
 * `withActionResult` 内で他アクションから利用する想定。
 */
async function getReturnRecordItemInternal(id: string): Promise<ReturnRecordItem | null> {
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
}

/**
 * 返礼品詳細情報を取得する
 */
export async function getReturnRecordItem(
	id: string,
): Promise<ActionResult<ReturnRecordItem | null>> {
	return withActionResult(async () => getReturnRecordItemInternal(id), "返礼品詳細情報の取得");
}

/**
 * 返礼品詳細情報を更新する
 */
export async function updateReturnRecordItem(
	input: UpdateReturnRecordItemInput,
	koudenId: string,
): Promise<ActionResult<ReturnRecordItem>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 更新前の情報を取得して返礼情報IDを保持
		const existingItem = await getReturnRecordItemInternal(input.id);
		if (!existingItem) {
			throw new KoudenError("返礼品詳細情報が見つかりません", ErrorCodes.NOT_FOUND);
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
			throw new KoudenError("返礼品詳細情報の更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(existingItem.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnRecordItem;
	}, "返礼品詳細情報の更新");
}

/**
 * 返礼品詳細情報を削除する
 */
export async function deleteReturnRecordItem(
	id: string,
	koudenId: string,
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

		// 削除前の情報を取得して返礼情報IDを保持
		const existingItem = await getReturnRecordItemInternal(id);
		if (!existingItem) {
			throw new KoudenError("返礼品詳細情報が見つかりません", ErrorCodes.NOT_FOUND);
		}

		const { error } = await supabase.from("return_record_items").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// 返礼情報の合計金額を更新
		await updateReturnRecordTotalAmount(existingItem.return_record_id);

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "返礼品詳細情報の削除");
}

/**
 * 返礼情報の合計金額を更新する（内部関数）
 *
 * 現在は select のみで実体の update はコメントアウトされている。
 * 失敗時は呼び出し元の `withActionResult` に伝播させる。
 */
async function updateReturnRecordTotalAmount(returnRecordId: string): Promise<void> {
	const supabase = await createClient();

	// 返礼品詳細の合計金額を計算
	const { error: itemsError } = await supabase
		.from("return_record_items")
		.select("price, quantity")
		.eq("return_record_id", returnRecordId);

	if (itemsError) {
		logger.error(
			{
				error: itemsError.message,
				returnRecordId,
			},
			"返礼情報の合計金額更新エラー",
		);
		throw itemsError;
	}

	// const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

	// 返礼情報の合計金額を更新
	// const { error: updateError } = await supabase
	//     .from("return_records")
	//     .update({ total_amount: totalAmount })
	//     .eq("id", returnRecordId);

	// if (updateError) {
	//     throw updateError;
	// }
}
