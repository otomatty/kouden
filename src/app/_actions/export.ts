"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import type { Database } from "@/types/supabase";

type KoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	offerings?: Database["public"]["Tables"]["offerings"]["Row"][];
	return_items?: Database["public"]["Tables"]["return_items"]["Row"][];
};

export async function exportKoudenToExcel(koudenId: string) {
	const supabase = await createClient();

	// 香典帳の基本情報を取得
	const { data: kouden } = await supabase
		.from("koudens")
		.select("*")
		.eq("id", koudenId)
		.single();

	if (!kouden) {
		throw new Error("香典帳が見つかりません");
	}

	// エントリー情報を取得
	const { data: entries } = await supabase
		.from("kouden_entries")
		.select(`
			*,
			offerings:offerings(*),
			return_items:return_items(*)
		`)
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: true });

	if (!entries) {
		throw new Error("エントリーの取得に失敗しました");
	}

	// エクセルデータの作成
	const worksheetData = (entries as unknown as KoudenEntry[]).map((entry) => ({
		日付: new Date(entry.created_at).toLocaleDateString(),
		氏名: entry.name,
		金額: entry.amount,
		供物: entry.offerings?.map((o) => o.type).join(", ") || "",
		返礼品: entry.return_items?.map((r) => r.name).join(", ") || "",
	}));

	// ワークブックとワークシートの作成
	const worksheet = XLSX.utils.json_to_sheet(worksheetData);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "エントリー一覧");

	// エクセルファイルの生成
	const excelBuffer = XLSX.write(workbook, {
		type: "buffer",
		bookType: "xlsx",
	});

	// フッファーをBase64文字列に変換
	const base64 = Buffer.from(excelBuffer).toString("base64");

	// ファイル名の生成（日本時間で）
	const date = new Date()
		.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
		.replace(/[\/\s:]/g, "");
	const fileName = `${kouden.title}_${date}.xlsx`;

	return {
		base64,
		fileName,
	};
}
