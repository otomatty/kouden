"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EllipsisVertical, UserPlus, XCircle, Download, Copy } from "lucide-react";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import ExportDropdown from "./export-dropdown";
import { useAtom, useAtomValue } from "jotai";
import { canUpdateKouden, canDeleteKouden } from "@/store/permission";
import type { KoudenPermission } from "@/types/role";
import { toast } from "sonner";
import { duplicateEntriesAtom } from "@/store/duplicateEntries";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DuplicateCheckButton } from "./duplicate-check-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface KoudenActionsMenuDesktopProps {
	koudenId: string;
	koudenTitle: string;
	/** 全機能アクセス許可 */
	fullAccess?: boolean;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
}

/**
 * デスクトップ版の香典帳アクションメニューコンポーネント
 * 横並びのボタンレイアウトでアクションを表示
 */
export function KoudenActionsMenuDesktop({
	koudenId,
	koudenTitle,
	fullAccess = true,
	permission,
	enableExcel,
}: KoudenActionsMenuDesktopProps) {
	const [, setDupResults] = useAtom(duplicateEntriesAtom);
	const duplicateResults = useAtomValue(duplicateEntriesAtom);

	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const isRestricted = fullAccess === false;

	const handleClearDuplicates = () => {
		setDupResults(null);
		toast.success("通常表示に戻しました", {
			description: "重複表示を解除して通常の表示に戻りました",
		});
		const params = new URLSearchParams(searchParams.toString());
		params.delete("isDuplicate");
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex items-center gap-2">
			{isRestricted ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<span>
							<Button variant="outline" disabled className="flex items-center gap-1">
								<Download className="w-4 h-4" />
								<span>ダウンロード</span>
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>有料プランで利用できます</TooltipContent>
				</Tooltip>
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<ExportDropdown koudenId={koudenId} enableExcel={enableExcel} />
					</TooltipTrigger>
					<TooltipContent>ファイルをダウンロード</TooltipContent>
				</Tooltip>
			)}

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
			{canUpdateKouden(permission) &&
				(isRestricted ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									variant="outline"
									disabled
									className="flex items-center gap-2 text-sm"
									data-tour="share-button"
								>
									<UserPlus className="h-4 w-4" />
									<span>共有</span>
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>有料プランで利用できます</TooltipContent>
					</Tooltip>
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline" asChild data-tour="share-button">
								<Link href={`/koudens/${koudenId}/members`}>
									<UserPlus className="h-4 w-4" />
									共有
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>香典帳を共有</TooltipContent>
					</Tooltip>
				))}
			{canUpdateKouden(permission) && (
				<Popover>
					<Tooltip>
						<TooltipTrigger asChild>
							<PopoverTrigger asChild>
								<Button variant="outline" data-tour="more-actions-button">
									<EllipsisVertical className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
						</TooltipTrigger>
						<TooltipContent>その他の操作</TooltipContent>
					</Tooltip>
					<PopoverContent align="end" className="w-[200px] !p-1">
						{canUpdateKouden(permission) && (
							<div className="flex flex-col gap-1">
								{!isRestricted && duplicateResults === null && (
									<Tooltip>
										<TooltipTrigger asChild>
											<DuplicateCheckButton koudenId={koudenId} />
										</TooltipTrigger>
										<TooltipContent>重複チェックを実行</TooltipContent>
									</Tooltip>
								)}
								{!isRestricted && <Separator />}
								{isRestricted ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="mx-auto">
												<Button variant="ghost" disabled className="flex items-center gap-2">
													<Copy className="h-4 w-4" />
													<span>香典帳を複製する</span>
												</Button>
											</span>
										</TooltipTrigger>
										<TooltipContent>有料プランで利用できます</TooltipContent>
									</Tooltip>
								) : (
									<Tooltip>
										<TooltipTrigger asChild>
											<DuplicateKoudenButton koudenId={koudenId} />
										</TooltipTrigger>
										<TooltipContent>香典帳を複製する</TooltipContent>
									</Tooltip>
								)}
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
