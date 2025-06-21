"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	exportSurveyDataToCsv,
	exportSurveySummaryToCsv,
} from "@/app/_actions/admin/survey-export";

/**
 * CSVファイルをダウンロードするヘルパー関数
 */
function downloadCsv(csvContent: string, filename: string) {
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);

	link.setAttribute("href", url);
	link.setAttribute("download", filename);
	link.style.visibility = "hidden";

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

/**
 * アンケートデータエクスポートボタンコンポーネント
 */
export function SurveyExportButtons() {
	const [isExporting, setIsExporting] = useState<string | null>(null);

	/**
	 * 生データをCSVエクスポート
	 */
	const handleExportRawData = async () => {
		setIsExporting("raw");
		try {
			const result = await exportSurveyDataToCsv();

			if (result.success && result.data) {
				downloadCsv(result.data, result.filename);
				toast.success("アンケートデータをエクスポートしました");
			} else {
				toast.error(result.error || "エクスポートに失敗しました");
			}
		} catch (error) {
			console.error("エクスポートエラー:", error);
			toast.error("予期しないエラーが発生しました");
		} finally {
			setIsExporting(null);
		}
	};

	/**
	 * 統計サマリーをCSVエクスポート
	 */
	const handleExportSummary = async () => {
		setIsExporting("summary");
		try {
			const result = await exportSurveySummaryToCsv();

			if (result.success && result.data) {
				downloadCsv(result.data, result.filename);
				toast.success("統計サマリーをエクスポートしました");
			} else {
				toast.error(result.error || "エクスポートに失敗しました");
			}
		} catch (error) {
			console.error("エクスポートエラー:", error);
			toast.error("予期しないエラーが発生しました");
		} finally {
			setIsExporting(null);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="gap-2">
					{isExporting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Download className="h-4 w-4" />
					)}
					データエクスポート
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem
					onClick={handleExportRawData}
					disabled={isExporting === "raw"}
					className="gap-2"
				>
					{isExporting === "raw" ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<FileText className="h-4 w-4" />
					)}
					<div className="flex flex-col">
						<span>生データ (CSV)</span>
						<span className="text-xs text-muted-foreground">全回答の詳細データ</span>
					</div>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={handleExportSummary}
					disabled={isExporting === "summary"}
					className="gap-2"
				>
					{isExporting === "summary" ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<BarChart3 className="h-4 w-4" />
					)}
					<div className="flex flex-col">
						<span>統計サマリー (CSV)</span>
						<span className="text-xs text-muted-foreground">集計結果とランキング</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * 単体の生データエクスポートボタン
 */
export function ExportRawDataButton() {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const result = await exportSurveyDataToCsv();

			if (result.success && result.data) {
				downloadCsv(result.data, result.filename);
				toast.success("アンケートデータをエクスポートしました");
			} else {
				toast.error(result.error || "エクスポートに失敗しました");
			}
		} catch (error) {
			console.error("エクスポートエラー:", error);
			toast.error("予期しないエラーが発生しました");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleExport}
			disabled={isExporting}
			className="gap-2"
		>
			{isExporting ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<FileText className="h-4 w-4" />
			)}
			生データ出力
		</Button>
	);
}

/**
 * 単体の統計サマリーエクスポートボタン
 */
export function ExportSummaryButton() {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const result = await exportSurveySummaryToCsv();

			if (result.success && result.data) {
				downloadCsv(result.data, result.filename);
				toast.success("統計サマリーをエクスポートしました");
			} else {
				toast.error(result.error || "エクスポートに失敗しました");
			}
		} catch (error) {
			console.error("エクスポートエラー:", error);
			toast.error("予期しないエラーが発生しました");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleExport}
			disabled={isExporting}
			className="gap-2"
		>
			{isExporting ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<BarChart3 className="h-4 w-4" />
			)}
			統計サマリー出力
		</Button>
	);
}
