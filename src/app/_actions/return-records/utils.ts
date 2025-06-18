"use server";

/**
 * 返礼情報に関する共通ユーティリティ
 * @module return-records/utils
 */

import { createClient } from "@/lib/supabase/server";

/**
 * ユーザー認証を確認し、認証済みのSupabaseクライアントとユーザー情報を返す
 * @returns {Promise<{ supabase: SupabaseClient, user: User }>} 認証済みのクライアントとユーザー情報
 * @throws {Error} 認証エラー
 */
export async function getAuthenticatedClient() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証されていません");
	}

	return { supabase, user };
}

/**
 * 香典エントリーIDから香典帳IDを取得する
 * @param {string} koudenEntryId - 香典エントリーID
 * @returns {Promise<string>} 香典帳ID
 * @throws {Error} 取得失敗時のエラー
 */
export async function getKoudenIdFromEntry(koudenEntryId: string): Promise<string> {
	const { supabase } = await getAuthenticatedClient();

	const { data, error } = await supabase
		.from("kouden_entries")
		.select("kouden_id")
		.eq("id", koudenEntryId)
		.single();

	if (error) {
		throw error;
	}

	if (!data) {
		throw new Error("香典エントリーが見つかりません");
	}

	return data.kouden_id;
}
