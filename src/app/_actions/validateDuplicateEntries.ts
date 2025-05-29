"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 重複エントリ検証結果の型定義
export interface DuplicateEntriesResult {
	name: string;
	ids: string[];
	count: number;
}

export async function validateDuplicateEntries(
	koudenId: string,
): Promise<DuplicateEntriesResult[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("kouden_entries")
		.select("id, name")
		.eq("kouden_id", koudenId);

	if (error) {
		console.error("[ERROR] validateDuplicateEntries failed:", error);
		throw new Error("重複検証中にエラーが発生しました");
	}

	if (!data) {
		return [];
	}

	// 名前でグルーピングして重複を抽出
	const groups: Record<string, string[]> = {};
	for (const row of data) {
		const name = row.name?.trim();
		if (!name) {
			continue;
		}
		if (!groups[name]) {
			groups[name] = [];
		}
		groups[name].push(row.id);
	}

	// グループごとに重複件数が2以上のものを結果に追加
	const results: DuplicateEntriesResult[] = [];
	for (const [name, ids] of Object.entries(groups)) {
		if (ids.length > 1) {
			results.push({ name, ids, count: ids.length });
		}
	}

	// Reset any previous duplicate flags for this kouden
	await supabase.from("kouden_entries").update({ is_duplicate: false }).eq("kouden_id", koudenId);

	// Mark current duplicates in the database
	for (const { ids } of results) {
		await supabase.from("kouden_entries").update({ is_duplicate: true }).in("id", ids);
	}

	// Revalidate the entries page so updated flags are fetched
	revalidatePath(`/koudens/${koudenId}/entries`);

	return results;
}
