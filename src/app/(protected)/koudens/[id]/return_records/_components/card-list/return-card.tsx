"use client";

// library
import { format } from "date-fns";
import { ja } from "date-fns/locale";
// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { Relationship } from "@/types/relationships";
// components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pen, Eye } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReturnCardProps {
	returnRecord: ReturnManagementSummary;
	relationships: Relationship[];
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
}

/**
 * 返礼状況のバッジ色を取得
 */
function getStatusBadgeVariant(status: string) {
	switch (status) {
		case "COMPLETED":
			return "default";
		case "PARTIAL_RETURNED":
			return "secondary";
		case "PENDING":
			return "outline";
		case "NOT_REQUIRED":
			return "destructive";
		default:
			return "outline";
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
		case "PENDING":
			return "未対応";
		case "NOT_REQUIRED":
			return "返礼不要";
		default:
			return status;
	}
}

/**
 * ReturnCardコンポーネント
 * 役割：個別の返礼情報カード表示
 */
export function ReturnCard({ returnRecord, relationships, onEditReturn }: ReturnCardProps) {
	// 関係性の表示名を取得
	const relationshipName =
		relationships.find((r) => r.name === returnRecord.relationshipName)?.name ||
		returnRecord.relationshipName;

	// 金額の合計を計算
	const totalGiftAmount =
		returnRecord.funeralGiftAmount + (returnRecord.additionalReturnAmount || 0);

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
						<span>¥{returnRecord.totalAmount.toLocaleString()}</span>
					</div>
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
