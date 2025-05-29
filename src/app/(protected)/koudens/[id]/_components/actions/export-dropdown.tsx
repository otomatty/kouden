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
import { Download } from "lucide-react";
import { ExportExcelButton } from "./export-excel-button";
import PdfDownloadButton from "@/components/pdf/PdfDownloadButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ExportDropdownProps {
	koudenId: string;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ koudenId }) => {
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
				<DropdownMenuItem asChild>
					<Tooltip>
						<TooltipTrigger asChild>
							<ExportExcelButton koudenId={koudenId} />
						</TooltipTrigger>
						<TooltipContent>Excel形式(.xlsx)でダウンロード</TooltipContent>
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
