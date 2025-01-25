"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, Copy, Trash2, FileSpreadsheet } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import { ExportExcelButton } from "./export-excel-button";

interface KoudenActionsMenuProps {
	koudenId: string;
	koudenTitle: string;
	permission: "owner" | "editor" | "viewer" | null;
	onDelete: (koudenId: string) => Promise<void>;
}

export function KoudenActionsMenu({
	koudenId,
	koudenTitle,
	permission,
	onDelete,
}: KoudenActionsMenuProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<div className="flex items-center gap-2">
				<ExportExcelButton koudenId={koudenId} />
				{(permission === "owner" || permission === "editor") && (
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-[200px]">
							<div className="flex flex-col gap-1">
								<DuplicateKoudenButton koudenId={koudenId} />
								{permission === "owner" && (
									<DeleteKoudenDialog
										koudenId={koudenId}
										koudenTitle={koudenTitle}
										onDelete={onDelete}
									/>
								)}
							</div>
						</PopoverContent>
					</Popover>
				)}
			</div>
		);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[200px]">
				<div className="flex flex-col gap-1">
					<ExportExcelButton koudenId={koudenId} />
					{(permission === "owner" || permission === "editor") && (
						<>
							<DuplicateKoudenButton koudenId={koudenId} />
							{permission === "owner" && (
								<DeleteKoudenDialog
									koudenId={koudenId}
									koudenTitle={koudenTitle}
									onDelete={onDelete}
								/>
							)}
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
