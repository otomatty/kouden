"use server";

/**
 * 返礼情報のページング処理
 * @module return-records/pagination
 */

import { createClient } from "@/lib/supabase/server";
import type { ReturnEntryRecordWithKoudenEntry } from "@/types/return-records/return-records";

/**
 * 香典帳IDに紐づく返礼情報をページング付きで取得する（無限スクロール用）
 * @param {string} koudenId - 香典帳ID
 * @param {number} limit - 取得件数（デフォルト100件）
 * @param {string} [cursor] - カーソル（最後のレコードのID）
 * @param {Object} filters - フィルター条件
 * @param {string} [filters.search] - 検索キーワード
 * @param {string} [filters.status] - ステータスフィルター
 * @returns {Promise<{ data: ReturnEntryRecord[], hasMore: boolean, nextCursor?: string }>} ページング付き返礼情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntriesByKoudenPaginated(
	koudenId: string,
	limit = 100,
	cursor?: string,
	filters?: {
		search?: string;
		status?: string;
	},
): Promise<{ data: ReturnEntryRecordWithKoudenEntry[]; hasMore: boolean; nextCursor?: string }> {
	try {
		const supabase = await createClient();

		// 最初に香典エントリーIDを取得
		const { data: koudenEntries, error: entriesError } = await supabase
			.from("kouden_entries")
			.select("id")
			.eq("kouden_id", koudenId);

		if (entriesError) {
			throw entriesError;
		}

		if (!koudenEntries || koudenEntries.length === 0) {
			return { data: [], hasMore: false };
		}

		const entryIds = koudenEntries.map((entry) => entry.id);

		let query = supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries (
					kouden_id,
					name,
					organization,
					position
				)
			`)
			.in("kouden_entry_id", entryIds)
			.order("created_at", { ascending: false })
			.limit(limit + 1); // 次のページがあるかチェックするため+1

		// カーソル（ページング）
		if (cursor) {
			query = query.lt("created_at", cursor);
		}

		// ステータスフィルター
		if (filters?.status && filters.status !== "all") {
			query = query.eq("return_status", filters.status);
		}

		// 検索フィルター（エントリー名または組織名）は最初のクエリで処理する
		if (filters?.search) {
			// 検索条件がある場合は、先に絞り込んだエントリーIDを取得し直す
			const { data: filteredEntries, error: filterError } = await supabase
				.from("kouden_entries")
				.select("id")
				.eq("kouden_id", koudenId)
				.or(`name.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`);

			if (filterError) {
				throw filterError;
			}

			const filteredIds = filteredEntries?.map((entry) => entry.id) || [];
			if (filteredIds.length === 0) {
				return { data: [], hasMore: false };
			}

			query = query.in("kouden_entry_id", filteredIds);
		}

		const { data, error } = await query;

		if (error) {
			throw error;
		}

		const records = data as ReturnEntryRecordWithKoudenEntry[];
		const hasMore = records.length > limit;
		const actualData = hasMore ? records.slice(0, limit) : records;
		const nextCursor = hasMore ? actualData[actualData.length - 1]?.created_at : undefined;

		return {
			data: actualData,
			hasMore,
			nextCursor,
		};
	} catch (error) {
		console.error("返礼情報一覧の取得エラー（ページング）:", error);
		throw error;
	}
}
