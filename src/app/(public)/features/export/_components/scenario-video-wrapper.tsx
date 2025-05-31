"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { FileSpreadsheet, FileText, SlidersHorizontal, Calendar, Archive } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "download-excel",
		title: "香典帳をExcelに",
		description: "ワンクリックで全データをExcelファイルとして保存。",
		icon: FileSpreadsheet,
		videoUrl: "/videos/export/download-excel.mp4",
	},
	{
		id: "share-pdf",
		title: "PDFで共有",
		description: "PDFをメール添付などで簡単に共有できます。",
		icon: FileText,
		videoUrl: "/videos/export/share-pdf.mp4",
	},
	{
		id: "custom-template",
		title: "カスタムテンプレート",
		description: "出力フォーマットを自由にカスタマイズ。",
		icon: SlidersHorizontal,
		videoUrl: "/videos/export/custom-template.mp4",
	},
	{
		id: "schedule-export",
		title: "定期エクスポート",
		description: "指定したスケジュールで自動的に書き出しを実行。",
		icon: Calendar,
		videoUrl: "/videos/export/schedule-export.mp4",
	},
	{
		id: "bulk-download",
		title: "一括ダウンロード",
		description: "複数期間のデータをまとめてダウンロード可能。",
		icon: Archive,
		videoUrl: "/videos/export/bulk-download.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
