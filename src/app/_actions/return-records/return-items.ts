"use server";

/**
 * 返礼品マスター情報に関するServer Actions
 * @module return-items
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReturnItem } from "@/types/return-records/return-items";

/**
 * 返礼品マスター情報作成時の入力型
 * @typedef {Object} CreateReturnItemInput
 * @property {string} name - 返礼品名
 * @property {string | null} description - 返礼品の説明
 * @property {number} price - 返礼品の価格
 * @property {string} kouden_id - 香典帳ID
 */
type CreateReturnItemInput = {
	name: string;
	description: string | null;
	price: number;
	kouden_id: string;
};

/**
 * 返礼品マスター情報更新時の入力型
 * @typedef {Object} UpdateReturnItemInput
 * @property {string} id - 返礼品マスターID
 * @property {string} [name] - 返礼品名
 * @property {string | null} [description] - 返礼品の説明
 * @property {number} [price] - 返礼品の価格
 */
type UpdateReturnItemInput = {
	id: string;
	name?: string;
	description?: string | null;
	price?: number;
};

/**
 * 返礼品マスター情報を作成する
 * @param {CreateReturnItemInput} input - 作成する返礼品マスター情報
 * @returns {Promise<void>} 作成された返礼品マスター情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnItem(input: CreateReturnItemInput): Promise<void> {
	try {
		console.log("[Server] Creating return item with input:", input);
		const supabase = await createClient();

		// より安全なユーザー認証の取得
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) {
			console.log("[Server] Authentication error:", userError);
			throw new Error("認証されていません");
		}

		// 入力データの検証
		if (!input.name || input.price < 0) {
			throw new Error("入力データが不正です");
		}

		// 必要なデータのみを抽出
		const returnItemData = {
			name: input.name,
			description: input.description,
			price: input.price,
			kouden_id: input.kouden_id,
			created_by: user.id,
		};

		// 権限の確認
		const { data: permission, error: permissionError } = await supabase
			.from("kouden_members")
			.select(`
				kouden_roles (
					name
				)
			`)
			.eq("kouden_id", input.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (permissionError || !permission) {
			console.log("[Server] Permission error:", permissionError);
			throw new Error("この香典帳に対する権限がありません");
		}

		const roleName = permission.kouden_roles?.name;
		const hasPermission = ["owner", "editor"].includes(roleName ?? "");
		if (!hasPermission) {
			throw new Error("返礼品の作成権限がありません");
		}

		console.log("[Server] Inserting return item:", returnItemData);
		const { error } = await supabase.from("return_items").insert(returnItemData);

		if (error) {
			console.log("[Server] Database error:", error);
			// エラーメッセージを具体的に
			if (error.code === "23505") {
				throw new Error("同じ名前の返礼品が既に存在します");
			}
			throw new Error(error.message || "返礼品の作成に失敗しました");
		}

		console.log("[Server] Successfully created return item");
		// キャッシュの再検証
		revalidatePath(`/koudens/${input.kouden_id}/settings/return-items`);
	} catch (error) {
		console.error("[Server] Error in createReturnItem:", error);
		// エラーメッセージを適切に変換
		if (error instanceof Error) {
			throw new Error(error.message);
		}
		throw new Error("予期せぬエラーが発生しました");
	}
}

/**
 * 香典帳IDに紐づく返礼品マスター情報一覧を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnItem[]>} 返礼品マスター情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnItems(koudenId: string): Promise<ReturnItem[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("return_items")
		.select("*")
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("返礼品の取得に失敗しました");
	}

	return data;
}

/**
 * 返礼品マスター情報を取得する
 * @param {string} id - 返礼品マスターID
 * @returns {Promise<ReturnItem | null>} 返礼品マスター情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnItem(id: string): Promise<ReturnItem | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase.from("return_items").select("*").eq("id", id).single();

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
 * @param {UpdateReturnItemInput & { kouden_id: string }} input - 更新する返礼品マスター情報
 * @returns {Promise<ReturnItem>} 更新された返礼品マスター情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnItem(
	input: UpdateReturnItemInput & { kouden_id: string },
): Promise<ReturnItem> {
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
			.from("return_items")
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
export async function deleteReturnItem(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		const { error } = await supabase.from("return_items").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("返礼品情報の削除エラー:", error);
		throw error;
	}
}
