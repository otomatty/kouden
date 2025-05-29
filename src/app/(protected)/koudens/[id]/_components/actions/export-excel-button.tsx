"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportKoudenToExcel } from "@/app/_actions/export";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ExportExcelButtonProps {
	koudenId: string;
}

export function ExportExcelButton({ koudenId }: ExportExcelButtonProps) {
	const [isExporting, setIsExporting] = useState(false);
	const { toast } = useToast();
	// クライアントサイドでのみレンダリングするかどうかを管理 (SSR対策)
	const [isClient, setIsClient] = useState(false);
	// コンポーネントがマウントされたかどうかを管理 (マウント遅延対策)
	const [isMounted, setIsMounted] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	useEffect(() => {
		setIsClient(true);

		// 少し遅延させてからマウント (レンダリングタイミング調整)
		const timer = setTimeout(() => {
			setIsMounted(true);
		}, 50); // 50ms

		return () => clearTimeout(timer);
	}, []);

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
				description: error instanceof Error ? error.message : "Excelファイルの出力に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	if (!isClient) {
		// SSR対策
		return null;
	}

	if (!isMounted) {
		// マウント遅延対策
		return null;
	}

	if (isDesktop) {
		return (
			<Button
				variant="ghost"
				onClick={handleExport}
				disabled={isExporting}
				className={cn(
					"text-[#217346] hover:text-[#1e6b41] hover:bg-[#217346]/10",
					isExporting && "opacity-50 cursor-not-allowed",
				)}
			>
				<FileSpreadsheet className="h-4 w-4" />
				{isExporting ? "出力中..." : "Excel(.xlsx)"}
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
			<span className="text-xs font-medium">{isExporting ? "出力中..." : "Excel(.xlsx)"}</span>
		</button>
	);
}
