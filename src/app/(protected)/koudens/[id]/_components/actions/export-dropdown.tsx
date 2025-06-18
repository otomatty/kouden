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
import { Download, FileSpreadsheet } from "lucide-react";
import { ExportExcelButton } from "./export-excel-button";
import PdfDownloadButton from "@/components/pdf/PdfDownloadButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ExportDropdownProps {
	koudenId: string;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ koudenId, enableExcel }) => {
	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="flex items-center gap-1">
							<Download className="w-4 h-4" />
							ダウンロード
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>ダウンロードオプションを表示</TooltipContent>
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
