"use client";

import type React from "react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { ExportExcelButton } from "./export-excel-button";
import { ExportCsvButton } from "./export-csv-button";
import PdfDownloadButton from "@/components/pdf/PdfDownloadButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ExportDropdownProps {
	koudenId: string;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
	/** CSV出力が有効かどうか */
	enableCsv: boolean;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ koudenId, enableExcel, enableCsv }) => {
	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="flex items-center gap-1"
							data-tour="export-dropdown"
						>
							<Download className="w-4 h-4" />
							ダウンロード
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>ファイルをダウンロード</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="start">
				{/* Excelオプション: 無料プラン時は無効化してツールチップで購入を促す */}
				<DropdownMenuItem asChild>
					<Tooltip>
						<TooltipTrigger asChild>
							{enableExcel ? (
								<ExportExcelButton koudenId={koudenId} />
							) : (
								<Button
									variant="ghost"
									disabled
									className="flex items-center gap-1 text-[#217346] opacity-50 cursor-not-allowed"
								>
									<FileSpreadsheet className="w-4 h-4" />
									Excel形式(.xlsx)
								</Button>
							)}
						</TooltipTrigger>
						<TooltipContent>
							{enableExcel
								? "Excel形式(.xlsx)でダウンロード"
								: "Excelをダウンロードするには有料プランを購入してください"}
						</TooltipContent>
					</Tooltip>
				</DropdownMenuItem>
				{/* CSVオプション: 無料プラン時は無効化してツールチップで購入を促す */}
				<DropdownMenuItem asChild>
					<Tooltip>
						<TooltipTrigger asChild>
							{enableCsv ? (
								<ExportCsvButton koudenId={koudenId} />
							) : (
								<Button
									variant="ghost"
									disabled
									className="flex items-center gap-1 text-[#0066cc] opacity-50 cursor-not-allowed"
								>
									<FileText className="w-4 h-4" />
									CSV形式(.csv)
								</Button>
							)}
						</TooltipTrigger>
						<TooltipContent>
							{enableCsv
								? "CSV形式(.csv)でダウンロード"
								: "CSVをダウンロードするには有料プランを購入してください"}
						</TooltipContent>
					</Tooltip>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Tooltip>
						<TooltipTrigger asChild>
							<PdfDownloadButton koudenId={koudenId} />
						</TooltipTrigger>
						<TooltipContent>PDF形式(.pdf)でダウンロード</TooltipContent>
					</Tooltip>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ExportDropdown;
