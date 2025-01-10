"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import type { Database } from "@/types/supabase";

type KoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	relationship: {
		name: string;
	} | null;
};

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
	const excelData = (mergedEntries as unknown as KoudenEntry[]).map(
		(entry) => ({
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
		}),
	);

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
