"use client";

import { EntryAllocationDialog } from "@/components/custom/EntryAllocationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// components
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Relationship } from "@/types/relationships";
// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
// library
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronRight, Eye, MoreHorizontal, Package, Pen } from "lucide-react";

interface ReturnCardProps {
	returnRecord: ReturnManagementSummary;
	relationships: Relationship[];
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
}

/**
 * 返礼状況のバッジVariantを取得
 */
function getStatusBadgeVariant(status: string) {
	switch (status) {
		case "COMPLETED":
			return "default";
		case "PARTIAL_RETURNED":
			return "secondary";
		case "NOT_REQUIRED":
			return "outline";
		default:
			return "destructive";
	}
}

/**
 * 返礼状況の表示名を取得
 */
function getStatusDisplayName(status: string) {
	switch (status) {
		case "COMPLETED":
			return "完了";
		case "PARTIAL_RETURNED":
			return "一部返礼";
		case "NOT_REQUIRED":
			return "返礼不要";
		case "PENDING":
			return "未対応";
		default:
			return status;
	}
}

/**
 * ReturnCardコンポーネント
 * 役割：個別の返礼情報カード表示
 * 🎯 フェーズ7実装: お供物配分の詳細表示を追加
 */
export function ReturnCard({ returnRecord, relationships, onEditReturn }: ReturnCardProps) {
	// 関係性の表示名を取得
	const relationshipName =
		relationships.find((r) => r.name === returnRecord.relationshipName)?.name ||
		returnRecord.relationshipName;

	// 金額の合計を計算
	const totalGiftAmount =
		returnRecord.funeralGiftAmount + (returnRecord.additionalReturnAmount || 0);

	// 🎯 フェーズ7: お供物配分の状況判定
	const hasOfferingAllocation = returnRecord.offeringTotal > 0;
	const offeringCount = returnRecord.offeringCount || 0;

	return (
		<Card className="w-full">
			<CardContent className="p-4">
				<div className="flex justify-between items-start mb-3">
					<div className="flex-1">
						<h3 className="font-medium text-sm">{returnRecord.entryName}</h3>
						<p className="text-xs text-muted-foreground">{returnRecord.organization}</p>
						{returnRecord.entryPosition && (
							<p className="text-xs text-muted-foreground">{returnRecord.entryPosition}</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Badge variant={getStatusBadgeVariant(returnRecord.returnStatus)}>
							{getStatusDisplayName(returnRecord.returnStatus)}
						</Badge>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									<Eye className="h-4 w-4 mr-2" />
									詳細表示
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onEditReturn?.(returnRecord)}>
									<Pen className="h-4 w-4 mr-2" />
									編集
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">関係性</span>
						<span>{relationshipName}</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">香典金額</span>
						<span>¥{returnRecord.koudenAmount.toLocaleString()}</span>
					</div>

					{/* 🎯 フェーズ7: お供物配分の詳細表示 */}
					{hasOfferingAllocation ? (
						<div className="space-y-1">
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">お供物配分</span>
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										{offeringCount}件
									</Badge>
									<span className="font-medium text-green-600">
										+¥{returnRecord.offeringTotal.toLocaleString()}
									</span>
								</div>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">合計金額</span>
								<span className="font-medium">¥{returnRecord.totalAmount.toLocaleString()}</span>
							</div>
							{/* 配分詳細ダイアログへのアクセス */}
							<div className="pt-1">
								<EntryAllocationDialog
									entryId={returnRecord.koudenEntryId}
									entryName={returnRecord.entryName}
									koudenAmount={returnRecord.koudenAmount}
									offeringTotal={returnRecord.offeringTotal}
								>
									<Button
										variant="ghost"
										size="sm"
										className="h-6 w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 justify-start"
									>
										<Package className="h-3 w-3 mr-1" />
										配分詳細を表示
										<ChevronRight className="h-3 w-3 ml-auto" />
									</Button>
								</EntryAllocationDialog>
							</div>
						</div>
					) : (
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">合計金額</span>
							<span>¥{returnRecord.totalAmount.toLocaleString()}</span>
						</div>
					)}

					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">返礼金額</span>
						<span>¥{totalGiftAmount.toLocaleString()}</span>
					</div>

					{returnRecord.returnMethod && (
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">返礼方法</span>
							<span>{returnRecord.returnMethod}</span>
						</div>
					)}
					{returnRecord.arrangementDate && (
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">手配日</span>
							<span>
								{format(new Date(returnRecord.arrangementDate), "yyyy/MM/dd", { locale: ja })}
							</span>
						</div>
					)}
				</div>

				{returnRecord.returnItems && returnRecord.returnItems.length > 0 && (
					<div className="mt-3 pt-3 border-t">
						<p className="text-xs text-muted-foreground mb-2">返礼品</p>
						<div className="space-y-1">
							{returnRecord.returnItems.map((item, index) => (
								<div key={`${item.name}-${index}`} className="flex justify-between text-xs">
									<span>
										{item.name} x{item.quantity || 1}
									</span>
									<span>¥{(item.price * item.quantity).toLocaleString()}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{returnRecord.remarks && (
					<div className="mt-3 pt-3 border-t">
						<p className="text-xs text-muted-foreground mb-1">備考</p>
						<p className="text-xs">{returnRecord.remarks}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
