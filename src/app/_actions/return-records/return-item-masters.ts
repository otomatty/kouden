/**
 * 返礼品マスター情報に関するServer Actions
 * @module return-item-masters
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

/**
 * 返礼品マスター情報作成時の入力型
 * @typedef {Object} CreateReturnItemMasterInput
 * @property {string} name - 返礼品名
 * @property {string | null} description - 返礼品の説明
 * @property {number} price - 返礼品の価格
 * @property {string} kouden_id - 香典帳ID
 */
type CreateReturnItemMasterInput = {
	name: string;
	description: string | null;
	price: number;
	kouden_id: string;
};

/**
 * 返礼品マスター情報更新時の入力型
 * @typedef {Object} UpdateReturnItemMasterInput
 * @property {string} id - 返礼品マスターID
 * @property {string} [name] - 返礼品名
 * @property {string | null} [description] - 返礼品の説明
 * @property {number} [price] - 返礼品の価格
 */
type UpdateReturnItemMasterInput = {
	id: string;
	name?: string;
	description?: string | null;
	price?: number;
};

/**
 * 返礼品マスター情報を作成する
 * @param {CreateReturnItemMasterInput} input - 作成する返礼品マスター情報
 * @returns {Promise<ReturnItemMaster>} 作成された返礼品マスター情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnItemMaster(
	input: CreateReturnItemMasterInput,
): Promise<ReturnItemMaster> {
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
			.from("return_item_masters")
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
			throw new Error("返礼品マスター情報の作成に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${input.kouden_id}`);

		return data;
	} catch (error) {
		console.error("返礼品マスター情報の作成エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく返礼品マスター情報一覧を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnItemMaster[]>} 返礼品マスター情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnItemMasters(koudenId: string): Promise<ReturnItemMaster[]> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_item_masters")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("返礼品マスター情報一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼品マスター情報を取得する
 * @param {string} id - 返礼品マスターID
 * @returns {Promise<ReturnItemMaster | null>} 返礼品マスター情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnItemMaster(id: string): Promise<ReturnItemMaster | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_item_masters")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data;
	} catch (error) {
		console.error("返礼品マスター情報の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼品マスター情報を更新する
 * @param {UpdateReturnItemMasterInput & { kouden_id: string }} input - 更新する返礼品マスター情報
 * @returns {Promise<ReturnItemMaster>} 更新された返礼品マスター情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnItemMaster(
	input: UpdateReturnItemMasterInput & { kouden_id: string },
): Promise<ReturnItemMaster> {
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

		const { data, error } = await supabase
			.from("return_item_masters")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼品マスター情報の更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data;
	} catch (error) {
		console.error("返礼品マスター情報の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼品マスター情報を削除する
 * @param {string} id - 返礼品マスターID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnItemMaster(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { error } = await supabase.from("return_item_masters").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("返礼品マスター情報の削除エラー:", error);
		throw error;
	}
}
