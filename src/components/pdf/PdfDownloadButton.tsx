"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import KoudenPdfDocument from "./KoudenPdfDocument";
import { exportKoudenToPdf } from "@/app/_actions/exportPdf";
import { useState } from "react";
import { toast } from "sonner";
import { PdfExportSurveyTrigger } from "@/components/survey";

interface PdfDownloadButtonProps {
	koudenId: string;
}

const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({ koudenId }) => {
	const [loadingData, setLoadingData] = useState(false);
	const [showSurvey, setShowSurvey] = useState(false);

	const handleClick = async () => {
		setLoadingData(true);
		try {
			// データを取得
			const d = await exportKoudenToPdf(koudenId);

			// PDF生成
			const asPdf = pdf(<KoudenPdfDocument data={d} />);
			const blob = await asPdf.toBlob();

			// ダウンロード処理
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			// ファイル名生成
			const now = new Date();
			const yyyy = now.getFullYear();
			const mm = `${now.getMonth() + 1}`.padStart(2, "0");
			const dd = `${now.getDate()}`.padStart(2, "0");
			const dateSuffix = `${yyyy}${mm}${dd}`;
			const safeTitle = d.title.replace(/\s+/g, "_");
			link.download = `${safeTitle}_${dateSuffix}.pdf`;

			// ダウンロード実行
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);

			// PDF出力成功の通知
			toast.success("PDFが正常に出力されました");

			// PDF出力成功時のみアンケート表示
			setShowSurvey(true);
		} catch (error) {
			console.error("PDF出力エラー:", error);
			toast.error("PDF出力に失敗しました。時間を置いてお試しください。");
			// エラー時はアンケート表示しない
		} finally {
			setLoadingData(false);
		}
	};

	return (
		<>
			<Button
				variant="ghost"
				onClick={handleClick}
				disabled={loadingData}
				className="text-[#fb0c00] hover:text-[#fb0c00] hover:bg-[#fb0c00]/10 w-full"
			>
				<FileText className="h-4 w-4" />
				{loadingData ? "生成中..." : "PDF(.pdf)"}
			</Button>

			{/* PDF出力成功後のアンケート表示 */}
			<PdfExportSurveyTrigger showSurvey={showSurvey} onShown={() => setShowSurvey(false)} />
		</>
	);
};

export default PdfDownloadButton;
