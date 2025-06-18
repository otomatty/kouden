"use client";

import { useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { AmountGroupData, ReturnItemMaster } from "@/types/return-records/bulk-update";

interface SelectAllCheckboxProps {
	/** 返礼品情報 */
	returnItem: ReturnItemMaster;
	/** 金額グループデータ配列 */
	amountGroups: AmountGroupData[];
	/** 金額グループ更新ハンドラー */
	onUpdateGroups: (updatedGroups: AmountGroupData[]) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * 返礼品の全選択用チェックボックス
 */
export function SelectAllCheckbox({
	returnItem,
	amountGroups,
	onUpdateGroups,
	disabled = false,
}: SelectAllCheckboxProps) {
	const checkboxRef = useRef<HTMLButtonElement>(null);
	// この返礼品を選択しているグループの数を計算
	const selectedGroupsCount = amountGroups.filter((group) =>
		group.selectedReturnItemIds.includes(returnItem.id),
	).length;

	const totalGroups = amountGroups.length;

	// チェック状態を決定
	const isAllSelected = selectedGroupsCount === totalGroups && totalGroups > 0;
	const isPartiallySelected = selectedGroupsCount > 0 && selectedGroupsCount < totalGroups;

	// indeterminate状態を設定
	useEffect(() => {
		if (checkboxRef.current) {
			const inputElement = checkboxRef.current.querySelector("input");
			if (inputElement) {
				inputElement.indeterminate = isPartiallySelected;
			}
		}
	}, [isPartiallySelected]);

	// 全選択/全解除の処理
	const handleToggleAll = (checked: boolean) => {
		const updatedGroups = amountGroups.map((group) => {
			const currentSelected = group.selectedReturnItemIds;
			const isCurrentlySelected = currentSelected.includes(returnItem.id);

			if (checked && !isCurrentlySelected) {
				// 選択状態にする
				return {
					...group,
					selectedReturnItemIds: [...currentSelected, returnItem.id],
				};
			}
			if (!checked && isCurrentlySelected) {
				// 選択解除する
				return {
					...group,
					selectedReturnItemIds: currentSelected.filter((id) => id !== returnItem.id),
				};
			}

			return group;
		});

		onUpdateGroups(updatedGroups);
	};

	return (
		<div className="flex items-center gap-1">
			<Checkbox
				ref={checkboxRef}
				checked={isAllSelected}
				onCheckedChange={handleToggleAll}
				disabled={disabled}
				className="h-4 w-4"
			/>
			<div className="text-[10px] text-center text-muted-foreground">
				{selectedGroupsCount}/{totalGroups}
			</div>
		</div>
	);
}
