"use server";

/**
 * 返礼方法種別に関するServer Actions
 * @module return-method-types
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnMethodType,
	CreateReturnMethodTypeInput,
	UpdateReturnMethodTypeInput,
} from "@/types/return-records/return-method-types";

/**
 * 返礼方法種別を作成する
 * @param {CreateReturnMethodTypeInput} input - 作成する返礼方法種別
 * @returns {Promise<ReturnMethodType>} 作成された返礼方法種別
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnMethodType(
	input: CreateReturnMethodTypeInput,
): Promise<ReturnMethodType> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new Error("認証されていません");
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
			throw new Error("返礼方法種別の作成に失敗しました");
		}

		revalidatePath("/settings/return-method-types");

		return data as ReturnMethodType;
	} catch (error) {
		console.error("返礼方法種別の作成エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法種別一覧を取得する
 * @returns {Promise<ReturnMethodType[]>} 返礼方法種別一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnMethodTypes(): Promise<ReturnMethodType[]> {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_method_types")
			.select("*")
			.order("sort_order", { ascending: true });

		if (error) {
			throw error;
		}

		return data as ReturnMethodType[];
	} catch (error) {
		console.error("返礼方法種別一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法種別を取得する
 * @param {string} id - 返礼方法種別ID
 * @returns {Promise<ReturnMethodType | null>} 返礼方法種別
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnMethodType(id: string): Promise<ReturnMethodType | null> {
	try {
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
	} catch (error) {
		console.error("返礼方法種別の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法種別を更新する
 * @param {UpdateReturnMethodTypeInput} input - 更新する返礼方法種別
 * @returns {Promise<ReturnMethodType>} 更新された返礼方法種別
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnMethodType(
	input: UpdateReturnMethodTypeInput,
): Promise<ReturnMethodType> {
	try {
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
			throw new Error("返礼方法種別の更新に失敗しました");
		}

		revalidatePath("/settings/return-method-types");

		return data as ReturnMethodType;
	} catch (error) {
		console.error("返礼方法種別の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法種別を削除する
 * @param {string} id - 返礼方法種別ID
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnMethodType(id: string): Promise<void> {
	try {
		const supabase = await createClient();
		const { error } = await supabase.from("return_method_types").delete().eq("id", id);

		if (error) {
			throw error;
		}

		revalidatePath("/settings/return-method-types");
	} catch (error) {
		console.error("返礼方法種別の削除エラー:", error);
		throw error;
	}
}
