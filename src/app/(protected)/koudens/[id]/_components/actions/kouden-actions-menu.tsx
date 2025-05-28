"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EllipsisVertical, UserPlus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import { ExportExcelButton } from "./export-excel-button";
import { useAtomValue } from "jotai";
import { permissionAtom, canUpdateKouden, canDeleteKouden } from "@/store/permission";

interface KoudenActionsMenuProps {
	koudenId: string;
	koudenTitle: string;
}

export function KoudenActionsMenu({ koudenId, koudenTitle }: KoudenActionsMenuProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const permission = useAtomValue(permissionAtom);

	if (isDesktop) {
		return (
			<div className="flex items-center gap-2">
				<ExportExcelButton koudenId={koudenId} />
				{canUpdateKouden(permission) && (
					<Button variant="outline" asChild>
						<Link href={`/koudens/${koudenId}/settings/members`}>
							<UserPlus className="h-4 w-4" />
							ユーザーを招待する
						</Link>
					</Button>
				)}
				{canUpdateKouden(permission) && (
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">
								<EllipsisVertical className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-[200px]">
							{canUpdateKouden(permission) && (
								<div className="flex flex-col gap-1">
									<DuplicateKoudenButton koudenId={koudenId} />
									{canDeleteKouden(permission) && (
										<DeleteKoudenDialog koudenId={koudenId} koudenTitle={koudenTitle} />
									)}
								</div>
							)}
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
					<EllipsisVertical className="h-6 w-6" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[200px]">
				<div className="flex flex-col gap-1">
					<ExportExcelButton koudenId={koudenId} />
					{canUpdateKouden(permission) && (
						<>
							<Button asChild className="w-full">
								<Link href={`/koudens/${koudenId}/settings/members`}>ユーザーを招待する</Link>
							</Button>
							<DuplicateKoudenButton koudenId={koudenId} />
							{canDeleteKouden(permission) && (
								<DeleteKoudenDialog koudenId={koudenId} koudenTitle={koudenTitle} />
							)}
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
