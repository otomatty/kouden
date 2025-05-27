"use server";

/**
 * 返礼情報選択返礼方法に関するServer Actions
 * @module return-record-selected-methods
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnRecordSelectedMethod,
	CreateReturnRecordSelectedMethodInput,
	UpdateReturnRecordSelectedMethodInput,
} from "@/types/return-records/return-record-selected-methods";

/**
 * 返礼情報に返礼方法を追加する
 * @param {CreateReturnRecordSelectedMethodInput} input - 作成する選択情報
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnRecordSelectedMethod>} 作成された選択情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnRecordSelectedMethod(
	input: CreateReturnRecordSelectedMethodInput,
	koudenId: string,
): Promise<ReturnRecordSelectedMethod> {
	try {
		const supabase = await createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_record_selected_methods")
			.insert({ ...input, created_by: session.user.id })
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼方法選択の作成に失敗しました");
		}

		revalidatePath(`/koudens/${koudenId}`);
		return data as ReturnRecordSelectedMethod;
	} catch (error) {
		console.error("返礼方法選択の作成エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報に紐づく返礼方法選択一覧を取得する
 * @param {string} returnRecordId - 返礼情報ID
 * @returns {Promise<ReturnRecordSelectedMethod[]>} 選択情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecordSelectedMethods(
	returnRecordId: string,
): Promise<ReturnRecordSelectedMethod[]> {
	try {
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
	} catch (error) {
		console.error("返礼方法選択一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法選択を取得する
 * @param {string} id - 選択ID
 * @returns {Promise<ReturnRecordSelectedMethod | null>} 選択情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnRecordSelectedMethod(
	id: string,
): Promise<ReturnRecordSelectedMethod | null> {
	try {
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
	} catch (error) {
		console.error("返礼方法選択の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法選択を更新する
 * @param {UpdateReturnRecordSelectedMethodInput} input - 更新する選択情報
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnRecordSelectedMethod>} 更新された選択情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordSelectedMethod(
	input: UpdateReturnRecordSelectedMethodInput,
	koudenId: string,
): Promise<ReturnRecordSelectedMethod> {
	try {
		const supabase = await createClient();
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
			throw new Error("返礼方法選択の更新に失敗しました");
		}

		revalidatePath(`/koudens/${koudenId}`);
		return data as ReturnRecordSelectedMethod;
	} catch (error) {
		console.error("返礼方法選択の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼方法選択を削除する
 * @param {string} id - 選択ID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnRecordSelectedMethod(
	id: string,
	koudenId: string,
): Promise<void> {
	try {
		const supabase = await createClient();
		const { error } = await supabase.from("return_record_selected_methods").delete().eq("id", id);

		if (error) {
			throw error;
		}

		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("返礼方法選択の削除エラー:", error);
		throw error;
	}
}
