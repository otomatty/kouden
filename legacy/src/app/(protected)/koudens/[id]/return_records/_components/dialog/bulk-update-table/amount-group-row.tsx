"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { calculateSelectedItemsCost } from "@/utils/bulk-update-helpers";
import type { AmountGroupData, ReturnItemMaster } from "@/types/return-records/bulk-update";
import type { ReturnStatus } from "@/types/return-records/return-records";
import { ReturnItemCheckbox } from "./return-item-checkbox";
import { StatusSelect } from "./status-select";

interface AmountGroupRowProps {
	/** 金額グループデータ */
	amountGroup: AmountGroupData;
	/** 利用可能な返礼品配列 */
	availableReturnItems: ReturnItemMaster[];
	/** 金額グループ更新ハンドラー */
	onUpdateGroup: (updatedGroup: AmountGroupData) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * 金額グループ行コンポーネント
 */
export function AmountGroupRow({
	amountGroup,
	availableReturnItems,
	onUpdateGroup,
	disabled = false,
}: AmountGroupRowProps) {
	// 返礼品選択状態の変更
	const handleReturnItemChange = (itemId: string, checked: boolean) => {
		const updatedSelectedIds = checked
			? [...amountGroup.selectedReturnItemIds, itemId]
			: amountGroup.selectedReturnItemIds.filter((id) => id !== itemId);

		onUpdateGroup({
			...amountGroup,
			selectedReturnItemIds: updatedSelectedIds,
		});
	};

	// ステータス変更
	const handleStatusChange = (status: ReturnStatus) => {
		onUpdateGroup({
			...amountGroup,
			status,
		});
	};

	// 選択された返礼品の総コスト
	const selectedCost = calculateSelectedItemsCost(
		amountGroup.selectedReturnItemIds,
		availableReturnItems,
	);

	// 損益計算
	const profitLoss = amountGroup.amount - selectedCost;

	return (
		<tr className="border-b hover:bg-muted/50">
			{/* 金額 */}
			<td className="p-4 font-medium">{formatCurrency(amountGroup.amount)}</td>

			{/* 件数 */}
			<td className="p-4 text-center">
				<Badge variant="outline">{amountGroup.count}件</Badge>
			</td>

			{/* 返礼品選択 */}
			{availableReturnItems.map((item) => (
				<td key={item.id} className="p-2 text-center border-l">
					<ReturnItemCheckbox
						returnItem={item}
						checked={amountGroup.selectedReturnItemIds.includes(item.id)}
						onCheckedChange={(checked) => handleReturnItemChange(item.id, checked)}
						disabled={disabled}
					/>
				</td>
			))}

			{/* 選択コスト */}
			<td className="p-4 text-right border-l">
				<div className="text-sm">{selectedCost > 0 ? formatCurrency(selectedCost) : "-"}</div>
			</td>

			{/* 損益 */}
			<td className="p-4 text-right">
				<Badge variant={profitLoss > 0 ? "default" : profitLoss < 0 ? "destructive" : "secondary"}>
					{profitLoss >= 0 ? "+" : ""}
					{formatCurrency(profitLoss)}
				</Badge>
			</td>

			{/* ステータス */}
			<td className="p-4 border-l">
				<StatusSelect
					value={amountGroup.status}
					onValueChange={handleStatusChange}
					disabled={disabled}
				/>
			</td>
		</tr>
	);
}
