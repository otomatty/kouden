"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import { ExportExcelButton } from "./export-excel-button";
import { useAtomValue } from "jotai";
import {
	permissionAtom,
	canUpdateKouden,
	canDeleteKouden,
} from "@/store/permission";

interface KoudenActionsMenuProps {
	koudenId: string;
	koudenTitle: string;
}

export function KoudenActionsMenu({
	koudenId,
	koudenTitle,
}: KoudenActionsMenuProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const permission = useAtomValue(permissionAtom);

	if (isDesktop) {
		return (
			<div className="flex items-center gap-2">
				<ExportExcelButton koudenId={koudenId} />
				{canUpdateKouden(permission) && (
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-[200px]">
							<div className="flex flex-col gap-1">
								<DuplicateKoudenButton koudenId={koudenId} />
								{canDeleteKouden(permission) && (
									<DeleteKoudenDialog
										koudenId={koudenId}
										koudenTitle={koudenTitle}
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
					{canUpdateKouden(permission) && (
						<>
							<DuplicateKoudenButton koudenId={koudenId} />
							{canDeleteKouden(permission) && (
								<DeleteKoudenDialog
									koudenId={koudenId}
									koudenTitle={koudenTitle}
								/>
							)}
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
