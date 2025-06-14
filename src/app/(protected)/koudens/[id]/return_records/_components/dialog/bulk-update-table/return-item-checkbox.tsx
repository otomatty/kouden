"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/currency";
import type { ReturnItemMaster } from "@/types/return-records/bulk-update";

interface ReturnItemCheckboxProps {
	/** 返礼品情報 */
	returnItem: ReturnItemMaster;
	/** 選択状態 */
	checked: boolean;
	/** 選択状態変更ハンドラー */
	onCheckedChange: (checked: boolean) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * 返礼品選択用チェックボックス
 */
export function ReturnItemCheckbox({
	returnItem,
	checked,
	onCheckedChange,
	disabled = false,
}: ReturnItemCheckboxProps) {
	return (
		<div className="flex flex-col items-center space-y-1 p-2">
			<Checkbox
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
				className="h-5 w-5"
			/>
			<div className="text-xs text-center">
				<div className="font-medium truncate max-w-[80px]" title={returnItem.name}>
					{returnItem.name}
				</div>
				<div className="text-muted-foreground">{formatCurrency(returnItem.price)}</div>
			</div>
		</div>
	);
}
