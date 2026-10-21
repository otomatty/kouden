"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ShoppingCart } from "lucide-react";
import type { ReturnItem } from "@/types/return-records/return-items";
import { ReturnItemSelector } from "./return-item-selector";
import { ReturnItemCard } from "./return-item-card";
import { ReturnRateInfo } from "./return-rate-info";
import { EmptyState } from "./empty-state";
import type { ReturnFormItemsProps } from "./types";

/**
 * ReturnFormItemsコンポーネント
 * 役割：返礼品の管理（マスターからの選択機能付き）
 */
export function ReturnFormItems({ form, selectedEntry, koudenId }: ReturnFormItemsProps) {
	const [showSelector, setShowSelector] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

	const { fields, append, remove, update } = useFieldArray({
		control: form.control,
		name: "return_items",
	});

	// アコーディオンの開閉状態を管理
	const toggleExpanded = (index: number) => {
		const newExpanded = new Set(expandedItems);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedItems(newExpanded);
	};

	// 手動で返礼品を追加
	const addCustomItem = () => {
		const newIndex = fields.length;
		append({
			name: "",
			price: 0,
			quantity: 1,
			notes: "",
			isFromMaster: false,
		});
		// 新しく追加したアイテムを自動で展開
		setExpandedItems((prev) => new Set([...prev, newIndex]));
	};

	// マスターから返礼品を選択
	const handleSelectFromMaster = (index?: number) => {
		setSelectedIndex(index ?? null);
		setShowSelector(true);
	};

	// 選択された返礼品をフォームに追加/更新
	const handleItemSelected = (item: ReturnItem) => {
		const returnItemData = {
			name: item.name,
			price: item.price,
			quantity: 1,
			notes: item.description || "",
			isFromMaster: true,
			masterId: item.id,
		};

		if (selectedIndex !== null) {
			// 既存アイテムを更新
			update(selectedIndex, returnItemData);
			// 更新したアイテムを展開
			setExpandedItems((prev) => new Set([...prev, selectedIndex]));
		} else {
			// 新しいアイテムを追加
			const newIndex = fields.length;
			append(returnItemData);
			// 新しく追加したアイテムを自動で展開
			setExpandedItems((prev) => new Set([...prev, newIndex]));
		}

		setShowSelector(false);
		setSelectedIndex(null);
	};

	// 合計金額の計算
	const totalAmount = fields.reduce((sum, _, index) => {
		const price = form.watch(`return_items.${index}.price`) || 0;
		const quantity = form.watch(`return_items.${index}.quantity`) || 0;
		return sum + price * quantity;
	}, 0);

	return (
		<div className="space-y-6">
			{/* 返礼対象情報と返礼率 */}
			<ReturnRateInfo selectedEntry={selectedEntry} totalAmount={totalAmount} />

			{/* 返礼品リスト */}
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<div>
						<h3 className="text-lg font-medium">返礼品</h3>
						<p className="text-sm text-muted-foreground">返礼品の詳細を入力してください</p>
					</div>
					<Badge variant="secondary">合計: ¥{totalAmount.toLocaleString()}</Badge>
				</div>

				{fields.length === 0 ? (
					<EmptyState
						onAddCustomItem={addCustomItem}
						onSelectFromMaster={() => handleSelectFromMaster()}
						onItemSelected={handleItemSelected}
						koudenId={koudenId}
						showSelector={showSelector}
						setShowSelector={setShowSelector}
					/>
				) : (
					<div className="space-y-4 max-h-[50vh] overflow-y-auto">
						{fields.map((field, index) => (
							<ReturnItemCard
								key={field.id}
								form={form}
								index={index}
								isExpanded={expandedItems.has(index)}
								onToggleExpanded={() => toggleExpanded(index)}
								onRemove={() => remove(index)}
								onSelectFromMaster={() => handleSelectFromMaster(index)}
								onItemSelected={handleItemSelected}
								koudenId={koudenId}
								showSelector={showSelector}
								selectedIndex={selectedIndex}
								setShowSelector={setShowSelector}
							/>
						))}

						{/* 返礼品追加ボタン */}
						<div className="flex gap-2">
							<Dialog open={showSelector && selectedIndex === null} onOpenChange={setShowSelector}>
								<DialogTrigger asChild>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSelectFromMaster()}
										className="flex-1"
									>
										<ShoppingCart className="h-4 w-4 mr-2" />
										マスターから選択
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
									<DialogHeader>
										<DialogTitle>返礼品を選択</DialogTitle>
										<DialogDescription>登録済みの返礼品から選択してください</DialogDescription>
									</DialogHeader>
									<ReturnItemSelector onSelect={handleItemSelected} koudenId={koudenId} />
								</DialogContent>
							</Dialog>
							<Button type="button" variant="outline" onClick={addCustomItem} className="flex-1">
								<Plus className="h-4 w-4 mr-2" />
								手動で追加
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
