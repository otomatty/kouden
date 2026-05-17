"use server";

/**
 * 返礼方法種別に関するServer Actions
 * @module return-method-types
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
	CreateReturnMethodTypeInput,
	ReturnMethodType,
	UpdateReturnMethodTypeInput,
} from "@/types/return-records/return-method-types";
import { revalidatePath } from "next/cache";

/**
 * 返礼方法種別を作成する
 */
export async function createReturnMethodType(
	input: CreateReturnMethodTypeInput,
): Promise<ActionResult<ReturnMethodType>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("return_method_types")
			.insert({ ...input, created_by: user.id })
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼方法種別の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		revalidatePath("/settings/return-method-types");

		return data as ReturnMethodType;
	}, "返礼方法種別の作成");
}

/**
 * 返礼方法種別一覧を取得する
 */
export async function getReturnMethodTypes(): Promise<ActionResult<ReturnMethodType[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_method_types")
			.select("*")
			.order("sort_order", { ascending: true });

		if (error) {
			throw error;
		}

		return data as ReturnMethodType[];
	}, "返礼方法種別一覧の取得");
}

/**
 * 返礼方法種別を取得する
 */
export async function getReturnMethodType(
	id: string,
): Promise<ActionResult<ReturnMethodType | null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_method_types")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data as ReturnMethodType | null;
	}, "返礼方法種別の取得");
}

/**
 * 返礼方法種別を更新する
 */
export async function updateReturnMethodType(
	input: UpdateReturnMethodTypeInput,
): Promise<ActionResult<ReturnMethodType>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { id, ...updateData } = input;
		const { data, error } = await supabase
			.from("return_method_types")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError("返礼方法種別の更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		revalidatePath("/settings/return-method-types");

		return data as ReturnMethodType;
	}, "返礼方法種別の更新");
}

/**
 * 返礼方法種別を削除する
 */
export async function deleteReturnMethodType(id: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { error } = await supabase.from("return_method_types").delete().eq("id", id);

		if (error) {
			throw error;
		}

		revalidatePath("/settings/return-method-types");
		return null;
	}, "返礼方法種別の削除");
}
