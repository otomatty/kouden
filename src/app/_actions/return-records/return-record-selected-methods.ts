"use server";

/**
 * 返礼情報選択返礼方法に関するServer Actions
 * @module return-record-selected-methods
 */

import { checkKoudenPermission } from "@/app/_actions/permissions";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
	CreateReturnRecordSelectedMethodInput,
	ReturnRecordSelectedMethod,
	UpdateReturnRecordSelectedMethodInput,
} from "@/types/return-records/return-record-selected-methods";
import { revalidatePath } from "next/cache";

/**
 * 返礼情報に返礼方法を追加する
 */
export async function createReturnRecordSelectedMethod(
	input: CreateReturnRecordSelectedMethodInput,
	koudenId: string,
): Promise<ActionResult<ReturnRecordSelectedMethod>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 編集権限 (owner / editor) を確認
		const permission = await checkKoudenPermission(koudenId);
		if (!["owner", "editor"].includes(permission)) {
			throw new KoudenError("返礼方法選択の作成権限がありません", ErrorCodes.FORBIDDEN);
		}

		const { data, error } = await supabase
			.from("return_record_selected_methods")
			.insert({ ...input, created_by: user.id })
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼方法選択の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		revalidatePath(`/koudens/${koudenId}`);
		return data as ReturnRecordSelectedMethod;
	}, "返礼方法選択の作成");
}

/**
 * 返礼情報に紐づく返礼方法選択一覧を取得する
 */
export async function getReturnRecordSelectedMethods(
	returnRecordId: string,
): Promise<ActionResult<ReturnRecordSelectedMethod[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_record_selected_methods")
			.select("*")
			.eq("return_record_id", returnRecordId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnRecordSelectedMethod[];
	}, "返礼方法選択一覧の取得");
}

/**
 * 返礼方法選択を取得する
 */
export async function getReturnRecordSelectedMethod(
	id: string,
): Promise<ActionResult<ReturnRecordSelectedMethod | null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_record_selected_methods")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data as ReturnRecordSelectedMethod | null;
	}, "返礼方法選択の取得");
}

/**
 * 返礼方法選択を更新する
 */
export async function updateReturnRecordSelectedMethod(
	input: UpdateReturnRecordSelectedMethodInput,
	koudenId: string,
): Promise<ActionResult<ReturnRecordSelectedMethod>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 編集権限 (owner / editor) を確認
		const permission = await checkKoudenPermission(koudenId);
		if (!["owner", "editor"].includes(permission)) {
			throw new KoudenError("返礼方法選択の更新権限がありません", ErrorCodes.FORBIDDEN);
		}

		const { id, ...updateData } = input;
		const { data, error } = await supabase
			.from("return_record_selected_methods")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼方法選択の更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		revalidatePath(`/koudens/${koudenId}`);
		return data as ReturnRecordSelectedMethod;
	}, "返礼方法選択の更新");
}

/**
 * 返礼方法選択を削除する
 */
export async function deleteReturnRecordSelectedMethod(
	id: string,
	koudenId: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 編集権限 (owner / editor) を確認
		const permission = await checkKoudenPermission(koudenId);
		if (!["owner", "editor"].includes(permission)) {
			throw new KoudenError("返礼方法選択の削除権限がありません", ErrorCodes.FORBIDDEN);
		}

		const { error } = await supabase.from("return_record_selected_methods").delete().eq("id", id);

		if (error) {
			throw error;
		}

		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "返礼方法選択の削除");
}
