"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportKoudenToExcel } from "@/app/_actions/export";

interface ExportExcelButtonProps {
	koudenId: string;
}

export function ExportExcelButton({ koudenId }: ExportExcelButtonProps) {
	const [isExporting, setIsExporting] = useState(false);
	const { toast } = useToast();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleExport = async () => {
		try {
			setIsExporting(true);
			const result = await exportKoudenToExcel(koudenId);

			// Base64文字列からBlobを作成
			const binaryString = window.atob(result.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			// ダウンロードリンクを作成
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = result.fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast({
				title: "Excelファイルを出力しました",
				description: `ファイル名: ${result.fileName}`,
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description:
					error instanceof Error
						? error.message
						: "Excelファイルの出力に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	if (isDesktop) {
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={handleExport}
				disabled={isExporting}
				className={cn(
					"bg-[#217346] text-white hover:bg-[#1e6b41] border-[#217346]",
					"hover:text-white",
					isExporting && "opacity-50 cursor-not-allowed",
				)}
			>
				<FileSpreadsheet className="mr-2 h-4 w-4" />
				{isExporting ? "出力中..." : "Excelをダウンロード"}
			</Button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleExport}
			disabled={isExporting}
			className={cn(
				"flex flex-col items-center gap-1.5 min-w-[60px] py-2 px-2 rounded-md transition-colors",
				"text-[#217346] hover:text-[#1e6b41] hover:bg-[#217346]/10",
				isExporting && "opacity-50 cursor-not-allowed",
			)}
		>
			<FileSpreadsheet className="h-5 w-5" />
			<span className="text-xs font-medium">
				{isExporting ? "出力中..." : "Excel"}
			</span>
		</button>
	);
}
