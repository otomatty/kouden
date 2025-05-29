"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import KoudenPdfDocument from "./KoudenPdfDocument";
import type { KoudenData } from "@/types/entries";
import { exportKoudenToPdf } from "@/app/_actions/exportPdf";
import { useState } from "react";

interface PdfDownloadButtonProps {
	koudenId: string;
}

const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({ koudenId }) => {
	const [loadingData, setLoadingData] = useState(false);

	const handleClick = async () => {
		setLoadingData(true);
		try {
			const d = await exportKoudenToPdf(koudenId);
			// Generate PDF blob and trigger download
			const asPdf = pdf(<KoudenPdfDocument data={d} />);
			const blob = await asPdf.toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			const now = new Date();
			const yyyy = now.getFullYear();
			const mm = `${now.getMonth() + 1}`.padStart(2, "0");
			const dd = `${now.getDate()}`.padStart(2, "0");
			const dateSuffix = `${yyyy}${mm}${dd}`;
			const safeTitle = d.title.replace(/\s+/g, "_");
			link.download = `${safeTitle}_${dateSuffix}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch {
			// エラー処理
		} finally {
			setLoadingData(false);
		}
	};

	return (
		<Button
			variant="ghost"
			onClick={handleClick}
			disabled={loadingData}
			className="text-[#fb0c00] hover:text-[#fb0c00] hover:bg-[#fb0c00]/10 w-full"
		>
			<FileText className="h-4 w-4" />
			{loadingData ? "生成中..." : "PDF(.pdf)"}
		</Button>
	);
};

export default PdfDownloadButton;
