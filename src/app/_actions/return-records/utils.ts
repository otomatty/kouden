"use server";

/**
 * 返礼情報に関する共通ユーティリティ
 * @module return-records/utils
 */

import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * ユーザー認証を確認し、認証済みのSupabaseクライアントとユーザー情報を返す
 *
 * 内部ヘルパー: `withActionResult` でラップされた Server Action 内から呼び出される想定。
 * 失敗時は `KoudenError` を throw し、外側の `withActionResult` が `ActionResult` に変換する。
 *
 * @returns 認証済みのクライアントとユーザー情報
 * @throws {KoudenError} 認証エラー
 */
export async function getAuthenticatedClient() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
	}

	return { supabase, user };
}

/**
 * 香典エントリーIDから香典帳IDを取得する
 *
 * 内部ヘルパー: `withActionResult` でラップされた Server Action 内から呼び出される想定。
 * 失敗時は raw Supabase エラー、または `KoudenError` を throw する。
 *
 * @param {string} koudenEntryId - 香典エントリーID
 * @returns {Promise<string>} 香典帳ID
 * @throws Supabase エラーまたは `KoudenError`
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
		throw new KoudenError("香典エントリーが見つかりません", ErrorCodes.NOT_FOUND);
	}

	return data.kouden_id;
}
