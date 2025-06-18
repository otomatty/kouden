"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import type { ReturnItem } from "@/types/return-records/return-items";
import { activeReturnItemsByKoudenAtomFamily } from "@/store/return-items";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import type { ReturnItemSelectorProps } from "./types";

/**
 * 返礼品選択ダイアログコンポーネント
 */
export function ReturnItemSelector({ onSelect, koudenId }: ReturnItemSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// jotaiストアから返礼品データを取得
	const availableItems = useAtomValue(activeReturnItemsByKoudenAtomFamily(koudenId));

	// フィルタリング
	const filteredItems = availableItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// カテゴリ表示名
	const getCategoryLabel = (category: string | null) => {
		const categoryMap: Record<string, string> = {
			FUNERAL_GIFT: "会葬品",
			GIFT_CARD: "ギフト券",
			FOOD: "食品",
			FLOWER: "花・植物",
			OTHER: "その他",
		};
		return category ? categoryMap[category] || category : "未分類";
	};

	return (
		<div className="h-[60vh] max-h-[500px] flex flex-col">
			<Command className="flex-1">
				<CommandInput
					placeholder="返礼品を検索..."
					value={searchQuery}
					onValueChange={setSearchQuery}
				/>
				<CommandList className="flex-1 overflow-y-auto">
					<CommandEmpty>返礼品が見つかりません</CommandEmpty>
					<CommandGroup>
						{filteredItems.map((item) => (
							<CommandItem key={item.id} onSelect={() => onSelect(item)} className="cursor-pointer">
								<div className="flex items-center justify-between w-full">
									<div className="flex-1">
										<div className="font-medium">{item.name}</div>
										<div className="text-sm text-muted-foreground">{item.description}</div>
										<div className="flex items-center gap-2 mt-1">
											<Badge variant="outline" className="text-xs">
												{getCategoryLabel(item.category)}
											</Badge>
											{item.recommended_amount_min && (
												<span className="text-xs text-muted-foreground">
													推奨: {item.recommended_amount_min.toLocaleString()}円〜
												</span>
											)}
										</div>
									</div>
									<div className="text-right">
										<div className="font-semibold">¥{item.price.toLocaleString()}</div>
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</Command>
		</div>
	);
}
