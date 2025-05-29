"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EllipsisVertical, UserPlus, XCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import ExportDropdown from "./export-dropdown";
import { useAtomValue, useAtom } from "jotai";
import { permissionAtom, canUpdateKouden, canDeleteKouden } from "@/store/permission";
import { useToast } from "@/hooks/use-toast";

import { duplicateEntriesAtom } from "@/store/duplicateEntries";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DuplicateCheckButton } from "./duplicate-check-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface KoudenActionsMenuProps {
	koudenId: string;
	koudenTitle: string;
}

export function KoudenActionsMenu({ koudenId, koudenTitle }: KoudenActionsMenuProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const permission = useAtomValue(permissionAtom);
	const [, setDupResults] = useAtom(duplicateEntriesAtom);
	const duplicateResults = useAtomValue(duplicateEntriesAtom);
	const { toast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const handleClearDuplicates = () => {
		setDupResults(null);
		toast({ title: "通常表示に戻しました" });
		const params = new URLSearchParams(searchParams.toString());
		params.delete("isDuplicate");
		router.push(`${pathname}?${params.toString()}`);
	};

	if (isDesktop) {
		return (
			<div className="flex items-center gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<ExportDropdown koudenId={koudenId} />
					</TooltipTrigger>
					<TooltipContent>ダウンロードオプションを表示</TooltipContent>
				</Tooltip>

				{canUpdateKouden(permission) && duplicateResults !== null && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								onClick={handleClearDuplicates}
								className="flex items-center gap-2 text-sm"
							>
								<XCircle className="h-4 w-4" />
								<span>通常表示</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>重複表示を解除</TooltipContent>
					</Tooltip>
				)}
				{canUpdateKouden(permission) && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline" asChild>
								<Link href={`/koudens/${koudenId}/settings/members`}>
									<UserPlus className="h-4 w-4" />
									共有
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>共有設定を開く</TooltipContent>
					</Tooltip>
				)}
				{canUpdateKouden(permission) && (
					<Popover>
						<Tooltip>
							<TooltipTrigger asChild>
								<PopoverTrigger asChild>
									<Button variant="outline">
										<EllipsisVertical className="h-4 w-4" />
									</Button>
								</PopoverTrigger>
							</TooltipTrigger>
							<TooltipContent>その他の操作</TooltipContent>
						</Tooltip>
						<PopoverContent align="end" className="w-[200px]">
							{canUpdateKouden(permission) && (
								<div className="flex flex-col gap-1">
									{duplicateResults === null && (
										<Tooltip>
											<TooltipTrigger asChild>
												<DuplicateCheckButton koudenId={koudenId} />
											</TooltipTrigger>
											<TooltipContent>重複チェックを実行</TooltipContent>
										</Tooltip>
									)}
									<Separator />
									<Tooltip>
										<TooltipTrigger asChild>
											<DuplicateKoudenButton koudenId={koudenId} />
										</TooltipTrigger>
										<TooltipContent>香典帳を複製する</TooltipContent>
									</Tooltip>
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
		<>
			<Popover>
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<EllipsisVertical className="h-6 w-6" />
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent>その他の操作</TooltipContent>
				</Tooltip>
				<PopoverContent align="end" className="w-[200px]">
					<div className="flex flex-col gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<ExportDropdown koudenId={koudenId} />
							</TooltipTrigger>
							<TooltipContent>ダウンロードオプションを表示</TooltipContent>
						</Tooltip>
						{canUpdateKouden(permission) && (
							<>
								{duplicateResults === null && (
									<Tooltip>
										<TooltipTrigger asChild>
											<DuplicateCheckButton koudenId={koudenId} />
										</TooltipTrigger>
										<TooltipContent>重複チェックを実行</TooltipContent>
									</Tooltip>
								)}
								{duplicateResults !== null && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												onClick={handleClearDuplicates}
												className="w-full flex items-center gap-2 text-sm"
											>
												<XCircle className="h-4 w-4" />
												<span>通常表示</span>
											</Button>
										</TooltipTrigger>
										<TooltipContent>重複表示を解除</TooltipContent>
									</Tooltip>
								)}
							</>
						)}
						<Separator />
						{canUpdateKouden(permission) && (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" asChild className="w-full">
											<Link href={`/koudens/${koudenId}/settings/members`}>共有</Link>
										</Button>
									</TooltipTrigger>
									<TooltipContent>共有設定を開く</TooltipContent>
								</Tooltip>
								<DuplicateKoudenButton koudenId={koudenId} />
								<Tooltip>
									<TooltipTrigger asChild>
										<DuplicateKoudenButton koudenId={koudenId} />
									</TooltipTrigger>
									<TooltipContent>香典帳を複製する</TooltipContent>
								</Tooltip>
								{canDeleteKouden(permission) && (
									<DeleteKoudenDialog koudenId={koudenId} koudenTitle={koudenTitle} />
								)}
							</>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
}
