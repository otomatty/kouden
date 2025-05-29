"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenData, KoudenEntry } from "@/types/entries";
import { formatAmount } from "@/utils/pdfFormatter";

/**
 * 香典帳 PDF 用データ取得
 * @param koudenId 香典帳 ID
 * @returns PDF 用データ
 */
export async function exportKoudenToPdf(koudenId: string): Promise<KoudenData> {
	const supabase = await createClient();
	// 香典帳タイトル取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("title")
		.eq("id", koudenId)
		.single();

	if (koudenError || !kouden) {
		console.error("[exportKoudenToPdf] koudenError:", koudenError, "kouden:", kouden);
		throw new Error("香典帳の取得に失敗しました");
	}

	// エントリ取得（金額が高い順）
	const { data: entries, error: entriesError } = await supabase
		.from("kouden_entries")
		.select("id,name,organization,postal_code,address,relationship_id,amount,notes")
		.eq("kouden_id", koudenId)
		.order("amount", { ascending: false });

	if (entriesError || !entries) {
		console.error("[exportKoudenToPdf] entriesError:", entriesError, "entries:", entries);
		throw new Error("香典データの取得に失敗しました");
	}

	// relationshipsテーブルを取得してマップを作成
	const { data: relations, error: relationsError } = await supabase
		.from("relationships")
		.select("id,name")
		.eq("kouden_id", koudenId);
	if (relationsError || !relations) {
		console.error("[exportKoudenToPdf] relationsError:", relationsError, "relations:", relations);
		throw new Error("関係性データの取得に失敗しました");
	}
	const relationsMap = new Map(relations.map((r) => [r.id, r.name]));

	// データマッピング
	const mappedEntries: KoudenEntry[] = entries.map((entry) => ({
		id: entry.id,
		name: entry.name ?? "",
		organization: entry.organization ?? "",
		postalCode: entry.postal_code ?? "",
		address: entry.address ?? "",
		relationship: entry.relationship_id ? (relationsMap.get(entry.relationship_id) ?? "") : "",
		amount: formatAmount(entry.amount),
		note: entry.notes ?? "",
	}));

	// 合計金額計算
	const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);

	const data: KoudenData = {
		title: kouden.title,
		entries: mappedEntries,
		total: formatAmount(totalAmount),
	};

	return data;
}
