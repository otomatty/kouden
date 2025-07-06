"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { exportKoudenToCsv } from "@/app/_actions/export";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ExportCsvButtonProps {
	koudenId: string;
}

export function ExportCsvButton({ koudenId }: ExportCsvButtonProps) {
	const [isExporting, setIsExporting] = useState(false);
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
			const result = await exportKoudenToCsv(koudenId);

			// CSV文字列からBlobを作成
			const blob = new Blob([result.csvContent], {
				type: "text/csv;charset=utf-8;",
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

			toast.success("CSVファイルを出力しました", {
				description: `ファイル名: ${result.fileName}`,
			});
		} catch (error) {
			toast.error("CSVファイルの出力に失敗しました", {
				description:
					error instanceof Error ? error.message : "しばらく時間をおいてから再度お試しください",
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
					"text-[#0066cc] hover:text-[#0052a3] hover:bg-[#0066cc]/10",
					isExporting && "opacity-50 cursor-not-allowed",
				)}
			>
				<FileText className="h-4 w-4" />
				{isExporting ? "出力中..." : "CSV(.csv)"}
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
				"text-[#0066cc] hover:text-[#0052a3] hover:bg-[#0066cc]/10",
				isExporting && "opacity-50 cursor-not-allowed",
			)}
		>
			<FileText className="h-5 w-5" />
			<span className="text-xs font-medium">{isExporting ? "出力中..." : "CSV(.csv)"}</span>
		</button>
	);
}
