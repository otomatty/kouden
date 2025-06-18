"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	Package,
	JapaneseYen,
	ExternalLink,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemCardProps {
	item: ReturnItem;
	onEdit: (item: ReturnItem) => void;
	onDelete: (itemId: string) => void;
	onToggleActive: (itemId: string, isActive: boolean) => void;
	koudenId?: string;
}

/**
 * 返礼品カードコンポーネント
 * 役割：個別の返礼品情報をカード形式で表示
 */
export function ReturnItemCard({
	item,
	onEdit,
	onDelete,
	onToggleActive,
	koudenId,
}: ReturnItemCardProps) {
	const [imageError, setImageError] = useState(false);
	const router = useRouter();

	// カテゴリの表示名を取得
	const getCategoryLabel = (category: string) => {
		const categoryMap: Record<string, string> = {
			FUNERAL_GIFT: "会葬品",
			GIFT_CARD: "ギフト券",
			FOOD: "食品",
			FLOWER: "花・植物",
			OTHER: "その他",
		};
		return categoryMap[category] || category;
	};

	// カテゴリの色を取得
	const getCategoryColor = (category: string) => {
		const colorMap: Record<string, string> = {
			FUNERAL_GIFT: "bg-blue-100 text-blue-800",
			GIFT_CARD: "bg-green-100 text-green-800",
			FOOD: "bg-orange-100 text-orange-800",
			FLOWER: "bg-pink-100 text-pink-800",
			OTHER: "bg-gray-100 text-gray-800",
		};
		return colorMap[category] || "bg-gray-100 text-gray-800";
	};

	// 推奨金額の表示
	const getRecommendedAmountText = () => {
		if (item.recommended_amount_max && item.recommended_amount_min) {
			return `${item.recommended_amount_min.toLocaleString()}円 〜 ${item.recommended_amount_max.toLocaleString()}円`;
		}
		return `${item.recommended_amount_min?.toLocaleString()}円 〜`;
	};

	return (
		<Card
			className={`relative transition-all duration-200 hover:shadow-md ${
				!item.is_active ? "opacity-60" : ""
			}`}
		>
			{/* アクティブ状態のインジケーター */}
			{!item.is_active && (
				<div className="absolute top-2 left-2 z-10">
					<Badge variant="secondary" className="text-xs">
						非表示
					</Badge>
				</div>
			)}

			{/* アクションメニュー */}
			<div className="absolute top-2 right-2 z-10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{koudenId && (
							<DropdownMenuItem
								onClick={() => router.push(`/koudens/${koudenId}/return_records/items/${item.id}`)}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								詳細を見る
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => onEdit(item)}>
							<Edit className="h-4 w-4 mr-2" />
							編集
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onToggleActive(item.id, !item.is_active)}>
							{item.is_active ? (
								<>
									<EyeOff className="h-4 w-4 mr-2" />
									非表示にする
								</>
							) : (
								<>
									<Eye className="h-4 w-4 mr-2" />
									表示する
								</>
							)}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
							<Trash2 className="h-4 w-4 mr-2" />
							削除
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<CardHeader className="pb-3">
				{/* 商品画像 */}
				<div className="aspect-square w-full bg-muted rounded-lg overflow-hidden mb-3">
					{item.image_url && !imageError ? (
						<img
							src={item.image_url}
							alt={item.name}
							className="w-full h-full object-cover"
							onError={() => setImageError(true)}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<Package className="h-12 w-12 text-muted-foreground" />
						</div>
					)}
				</div>

				{/* カテゴリバッジ */}
				<Badge
					variant="secondary"
					className={`w-fit text-xs ${getCategoryColor(item.category || "")}`}
				>
					{getCategoryLabel(item.category || "")}
				</Badge>
			</CardHeader>

			<CardContent className="pt-0">
				{/* 商品名 */}
				<h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.name}</h3>

				{/* 説明文 */}
				{item.description && (
					<p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
				)}

				{/* 価格 */}
				<div className="flex items-center text-lg font-bold text-primary mb-2">
					<JapaneseYen className="h-4 w-4 mr-1" />
					{item.price.toLocaleString()}
				</div>

				{/* 推奨香典金額 */}
				<div className="text-xs text-muted-foreground">
					推奨香典金額: {getRecommendedAmountText()}
				</div>
			</CardContent>

			<CardFooter className="pt-0">
				{koudenId ? (
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => router.push(`/koudens/${koudenId}/return_records/items/${item.id}`)}
					>
						<ExternalLink className="h-4 w-4 mr-2" />
						詳細を見る
					</Button>
				) : (
					<Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(item)}>
						詳細・編集
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
