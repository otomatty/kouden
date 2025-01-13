"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { exportKoudenToExcel } from "@/app/_actions/export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExportExcelButtonProps {
	koudenId: string;
}

export function ExportExcelButton({ koudenId }: ExportExcelButtonProps) {
	const [isExporting, setIsExporting] = useState(false);
	const { toast } = useToast();

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
				title: "エクセルファイルを出力しました",
				description: `ファイル名: ${result.fileName}`,
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description:
					error instanceof Error
						? error.message
						: "エクセルファイルの出力に失敗しました",
				variant: "destructive",
			});
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
			className={cn(
				"bg-[#217346] text-white hover:bg-[#1e6b41] border-[#217346]",
				"hover:text-white",
				isExporting && "opacity-50 cursor-not-allowed",
			)}
		>
			<FileSpreadsheet className="mr-2 h-4 w-4" />
			{isExporting ? "出力中..." : "エクセル出力"}
		</Button>
	);
}
