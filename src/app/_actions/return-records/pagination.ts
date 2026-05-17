"use server";

/**
 * 返礼情報のページング処理
 * @module return-records/pagination
 */

import { type ActionResult, withActionResult } from "@/lib/errors";
import { buildOrIlikePattern } from "@/lib/security/search-sanitize";
import { createClient } from "@/lib/supabase/server";
import type { ReturnEntryRecordWithKoudenEntry } from "@/types/return-records/return-records";

/**
 * 香典帳IDに紐づく返礼情報をページング付きで取得する（無限スクロール用）
 */
export async function getReturnEntriesByKoudenPaginated(
	koudenId: string,
	limit = 100,
	cursor?: string,
	filters?: {
		search?: string;
		status?: string;
	},
): Promise<
	ActionResult<{
		data: ReturnEntryRecordWithKoudenEntry[];
		hasMore: boolean;
		nextCursor?: string;
	}>
> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// kouden_entries を INNER JOIN し、香典帳IDで絞り込む。
		// 検索フィルタはJOIN先のカラムに対して同じクエリ内で適用するため、
		// 事前にエントリーIDを取得する追加クエリは不要となる。
		let query = supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					kouden_id,
					name,
					organization,
					position,
					amount
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
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

		// 検索フィルター（JOIN先テーブルのカラムに対して直接 OR を適用）
		// PostgREST .or() に渡す値は区切り文字と ILIKE ワイルドカードをサニタイズする
		if (filters?.search) {
			const search = buildOrIlikePattern(filters.search);
			query = query.or(`name.ilike.${search},organization.ilike.${search}`, {
				referencedTable: "kouden_entries",
			});
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
	}, "返礼情報一覧の取得（ページング）");
}
