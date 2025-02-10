"use server";

/**
 * 配送方法に関するServer Actions
 * @module delivery-methods
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";

/**
 * 配送方法作成時の入力型
 * @typedef {Object} CreateDeliveryMethodInput
 * @property {string} name - 配送方法名
 * @property {string | null} description - 配送方法の説明
 * @property {boolean} is_system - システム定義の配送方法かどうか
 * @property {string} kouden_id - 香典帳ID
 */
type CreateDeliveryMethodInput = {
	name: string;
	description: string | null;
	is_system: boolean;
	kouden_id: string;
};

/**
 * 配送方法更新時の入力型
 * @typedef {Object} UpdateDeliveryMethodInput
 * @property {string} id - 配送方法ID
 * @property {string} [name] - 配送方法名
 * @property {string | null} [description] - 配送方法の説明
 */
type UpdateDeliveryMethodInput = {
	id: string;
	name?: string;
	description?: string | null;
};

/**
 * 配送方法を作成する
 * @param {CreateDeliveryMethodInput} input - 作成する配送方法情報
 * @returns {Promise<DeliveryMethod>} 作成された配送方法情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createDeliveryMethod(
	input: CreateDeliveryMethodInput,
): Promise<DeliveryMethod> {
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
			.from("delivery_methods")
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
			throw new Error("配送方法の作成に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${input.kouden_id}`);

		return data;
	} catch (error) {
		console.error("配送方法の作成エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく配送方法一覧を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<DeliveryMethod[]>} 配送方法一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getDeliveryMethods(koudenId: string): Promise<DeliveryMethod[]> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("delivery_methods")
			.select(`
				id,
				name,
				description,
				is_system,
				kouden_id,
				created_at,
				updated_at,
				created_by
			`)
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("配送方法一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 配送方法を取得する
 * @param {string} id - 配送方法ID
 * @returns {Promise<DeliveryMethod | null>} 配送方法情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getDeliveryMethod(id: string): Promise<DeliveryMethod | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("delivery_methods")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data;
	} catch (error) {
		console.error("配送方法の取得エラー:", error);
		throw error;
	}
}

/**
 * 配送方法を更新する
 * @param {UpdateDeliveryMethodInput & { kouden_id: string }} input - 更新する配送方法情報
 * @returns {Promise<DeliveryMethod>} 更新された配送方法情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateDeliveryMethod(
	input: UpdateDeliveryMethodInput & { kouden_id: string },
): Promise<DeliveryMethod> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		// システム定義の配送方法は更新不可
		const existingMethod = await getDeliveryMethod(input.id);
		if (existingMethod?.is_system) {
			throw new Error("システム定義の配送方法は更新できません");
		}

		const { id, kouden_id, ...updateData } = input;

		const { data, error } = await supabase
			.from("delivery_methods")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("配送方法の更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data;
	} catch (error) {
		console.error("配送方法の更新エラー:", error);
		throw error;
	}
}

/**
 * 配送方法を削除する
 * @param {string} id - 配送方法ID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteDeliveryMethod(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("認証されていません");
		}

		// システム定義の配送方法は削除不可
		const existingMethod = await getDeliveryMethod(id);
		if (existingMethod?.is_system) {
			throw new Error("システム定義の配送方法は削除できません");
		}

		const { error } = await supabase.from("delivery_methods").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("配送方法の削除エラー:", error);
		throw error;
	}
}
