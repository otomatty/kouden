"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Search } from "lucide-react";

interface SearchableSelectorItem {
	id: string;
	name: string | null;
	organization?: string | null;
	position?: string | null;
	amount?: number | null;
	notes?: string | null;
}

interface SearchableSelectorDialogProps {
	/**
	 * 選択可能な香典情報の配列
	 */
	items: SearchableSelectorItem[];
	/**
	 * 現在選択されている香典情報のID配列
	 */
	selectedIds: string[];
	/**
	 * 選択が変更された時のコールバック関数
	 */
	onSelectionChange: (selectedIds: string[]) => void;
	/**
	 * ダイアログを開くためのトリガー要素
	 */
	trigger: React.ReactNode;
	/**
	 * ダイアログのタイトル
	 * @default "関連する香典を選択"
	 */
	title?: string;
	/**
	 * ダイアログの説明文
	 * @default "複数選択可能です"
	 */
	description?: string;
	/**
	 * 検索プレースホルダーテキスト
	 * @default "香典情報を検索..."
	 */
	searchPlaceholder?: string;
	/**
	 * ダイアログの開閉状態
	 */
	open?: boolean;
	/**
	 * ダイアログの開閉状態が変更された時のコールバック関数
	 */
	onOpenChange?: (open: boolean) => void;
}

export function SearchableSelectorDialog({
	items,
	selectedIds,
	onSelectionChange,
	trigger,
	title = "関連する香典を選択",
	description = "複数選択可能です",
	searchPlaceholder = "香典情報を検索...",
}: SearchableSelectorDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// 検索クエリに基づいてアイテムをフィルタリング
	const filteredItems = items.filter((item) => {
		const searchTarget = [
			item.name,
			item.organization,
			item.position,
			item.amount?.toString(),
			item.notes,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return searchTarget.includes(searchQuery.toLowerCase());
	});

	// チェックボックスの状態変更ハンドラー
	const handleCheckboxChange = useCallback(
		(itemId: string, checked: boolean) => {
			if (checked) {
				onSelectionChange([...selectedIds, itemId]);
			} else {
				onSelectionChange(selectedIds.filter((id) => id !== itemId));
			}
		},
		[selectedIds, onSelectionChange],
	);

	// 全選択/全解除ハンドラー
	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				onSelectionChange(filteredItems.map((item) => item.id));
			} else {
				onSelectionChange([]);
			}
		},
		[filteredItems, onSelectionChange],
	);

	return (
		<ResponsiveDialog
			trigger={trigger}
			title={title}
			description={description}
			className="space-y-4"
		>
			{/* 検索フィールド */}
			<div className="relative">
				<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={searchPlaceholder}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-8"
				/>
			</div>

			{/* 全選択/全解除ボタン */}
			<div className="flex items-center space-x-2">
				<Checkbox
					id="select-all"
					checked={
						filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id))
					}
					onCheckedChange={handleSelectAll}
				/>
				<Label htmlFor="select-all">全て選択/解除</Label>
			</div>

			{/* アイテムリスト */}
			<ScrollArea className="h-[300px] pr-4">
				<div className="space-y-4">
					{filteredItems.map((item) => (
						<div key={item.id} className="flex items-start space-x-3">
							<Checkbox
								id={item.id}
								checked={selectedIds.includes(item.id)}
								onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
							/>
							<Label htmlFor={item.id} className="text-sm leading-none">
								<div className="font-medium">{item.name}</div>
								{item.organization && (
									<div className="text-muted-foreground mt-1">{item.organization}</div>
								)}
								{item.position && <div className="text-muted-foreground">{item.position}</div>}
								{item.amount && (
									<div className="text-muted-foreground">{item.amount.toLocaleString()}円</div>
								)}
								{item.notes && (
									<div className="text-muted-foreground text-xs mt-1">{item.notes}</div>
								)}
							</Label>
						</div>
					))}
					{filteredItems.length === 0 && (
						<div className="text-center text-muted-foreground py-4">
							該当する香典情報が見つかりません
						</div>
					)}
				</div>
			</ScrollArea>

			{/* 選択中の件数表示 */}
			<div className="text-sm text-muted-foreground">{selectedIds.length}件選択中</div>
			<DialogClose asChild>
				<Button variant="outline">完了</Button>
			</DialogClose>
		</ResponsiveDialog>
	);
}
