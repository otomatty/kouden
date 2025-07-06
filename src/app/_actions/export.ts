"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import type { Database } from "@/types/supabase";

type Entry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	relationship: {
		name: string;
	} | null;
};

/**
 * 香典帳のエクスポート
 * @param koudenId 香典帳ID
 * @returns エクスポートされた香典帳
 */
export async function exportKoudenToExcel(koudenId: string) {
	const supabase = await createClient();

	// 香典帳の情報を取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("title")
		.eq("id", koudenId)
		.single();

	if (koudenError) {
		throw new Error("香典帳の取得に失敗しました");
	}

	// 香典データを取得
	const { data: entries, error: entriesError } = await supabase
		.from("kouden_entries")
		.select("*")
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (entriesError) {
		throw new Error("香典データの取得に失敗しました");
	}

	// 関係性データを取得
	const { data: relationships, error: relationshipsError } = await supabase
		.from("relationships")
		.select("id, name")
		.eq("kouden_id", koudenId);

	if (relationshipsError) {
		throw new Error("関係性データの取得に失敗しました");
	}

	// データを結合
	const mergedEntries = entries.map((entry) => ({
		...entry,
		relationship: relationships.find((r) => r.id === entry.relationship_id),
	}));

	// Excelワークブックを作成
	const workbook = XLSX.utils.book_new();

	// データを変換
	const excelData = (mergedEntries as unknown as Entry[]).map((entry) => ({
		ご芳名: entry.name,
		団体名: entry.organization || "",
		役職: entry.position || "",
		ご関係: entry.relationship?.name || "",
		金額: entry.amount,
		郵便番号: entry.postal_code || "",
		住所: entry.address,
		電話番号: entry.phone_number || "",
		参列:
			entry.attendance_type === "FUNERAL"
				? "葬儀"
				: entry.attendance_type === "CONDOLENCE_VISIT"
					? "弔問"
					: "欠席",
		供物: entry.has_offering ? "有" : "無",
		備考: entry.notes || "",
	}));

	// ワークシートを作成
	const worksheet = XLSX.utils.json_to_sheet(excelData);

	// ワークブックにワークシートを追加
	XLSX.utils.book_append_sheet(workbook, worksheet, "香典帳");

	// Excelファイルをバイナリ形式で生成
	const excelBuffer = XLSX.write(workbook, {
		type: "base64",
		bookType: "xlsx",
	});

	return {
		base64: excelBuffer,
		fileName: `${kouden.title}_${new Date().toISOString().split("T")[0]}.xlsx`,
	};
}

/**
 * 香典帳のCSV出力
 * @param koudenId 香典帳ID
 * @returns エクスポートされたCSV文字列とファイル名
 */
export async function exportKoudenToCsv(koudenId: string) {
	const supabase = await createClient();

	// 香典帳の情報を取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("title")
		.eq("id", koudenId)
		.single();

	if (koudenError) {
		throw new Error("香典帳の取得に失敗しました");
	}

	// 香典データを取得
	const { data: entries, error: entriesError } = await supabase
		.from("kouden_entries")
		.select("*")
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (entriesError) {
		throw new Error("香典データの取得に失敗しました");
	}

	// 関係性データを取得
	const { data: relationships, error: relationshipsError } = await supabase
		.from("relationships")
		.select("id, name")
		.eq("kouden_id", koudenId);

	if (relationshipsError) {
		throw new Error("関係性データの取得に失敗しました");
	}

	// データを結合
	const mergedEntries = entries.map((entry) => ({
		...entry,
		relationship: relationships.find((r) => r.id === entry.relationship_id),
	}));

	// CSVヘッダー
	const headers = [
		"ご芳名",
		"団体名",
		"役職",
		"ご関係",
		"金額",
		"郵便番号",
		"住所",
		"電話番号",
		"参列",
		"供物",
		"備考",
	];

	// CSVデータ行を生成
	const csvRows = (mergedEntries as unknown as Entry[]).map((entry) => [
		entry.name,
		entry.organization || "",
		entry.position || "",
		entry.relationship?.name || "",
		entry.amount,
		entry.postal_code || "",
		entry.address,
		entry.phone_number || "",
		entry.attendance_type === "FUNERAL"
			? "葬儀"
			: entry.attendance_type === "CONDOLENCE_VISIT"
				? "弔問"
				: "欠席",
		entry.has_offering ? "有" : "無",
		entry.notes || "",
	]);

	// CSV文字列を生成（BOM付きでExcelでの文字化け防止）
	const csvContent = `\uFEFF${[headers, ...csvRows]
		.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
		.join("\n")}`;

	return {
		csvContent,
		fileName: `${kouden.title}_${new Date().toISOString().split("T")[0]}.csv`,
	};
}
