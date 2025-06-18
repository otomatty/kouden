"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/utils/currency";
import { calculateGroupStatistics } from "@/utils/bulk-update-helpers";
import type { AmountGroupData, ReturnItemMaster } from "@/types/return-records/bulk-update";
import { AmountGroupRow } from "./amount-group-row";
import { SelectAllCheckbox } from "./select-all-checkbox";

interface BulkUpdateTableProps {
	/** 金額グループデータ配列 */
	amountGroups: AmountGroupData[];
	/** 利用可能な返礼品配列 */
	availableReturnItems: ReturnItemMaster[];
	/** 金額グループ更新ハンドラー */
	onUpdateGroups: (updatedGroups: AmountGroupData[]) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * 一括更新テーブルコンポーネント
 */
export function BulkUpdateTable({
	amountGroups,
	availableReturnItems,
	onUpdateGroups,
	disabled = false,
}: BulkUpdateTableProps) {
	// 個別グループの更新
	const handleUpdateGroup = (index: number, updatedGroup: AmountGroupData) => {
		const newGroups = [...amountGroups];
		newGroups[index] = updatedGroup;
		onUpdateGroups(newGroups);
	};

	// 統計情報
	const statistics = calculateGroupStatistics(amountGroups);

	if (amountGroups.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">対象となる返礼記録がありません</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* 統計情報 */}
			<div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
				<div className="text-center">
					<div className="text-2xl font-bold text-primary">{statistics.totalEntries}</div>
					<div className="text-sm text-muted-foreground">総件数</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-primary">{statistics.uniqueAmounts}</div>
					<div className="text-sm text-muted-foreground">金額種類</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-primary">
						{formatCurrency(statistics.totalAmount)}
					</div>
					<div className="text-sm text-muted-foreground">総金額</div>
				</div>
			</div>

			{/* テーブル */}
			<ScrollArea className="h-[500px] w-full border rounded-lg">
				<table className="w-full">
					<thead className="sticky top-0 bg-background border-b">
						<tr>
							<th className="p-4 text-left font-medium">金額</th>
							<th className="p-4 text-center font-medium">件数</th>
							{availableReturnItems.map((item) => (
								<th key={item.id} className="p-2 text-center font-medium border-l min-w-[100px]">
									<div className="text-xs space-y-1">
										<div
											className="truncate flex items-center justify-center gap-1"
											title={item.name}
										>
											<SelectAllCheckbox
												returnItem={item}
												amountGroups={amountGroups}
												onUpdateGroups={onUpdateGroups}
												disabled={disabled}
											/>
											<div className="text-md truncate">{item.name}</div>
										</div>
										<div className="text-muted-foreground">{formatCurrency(item.price)}</div>
									</div>
								</th>
							))}
							<th className="p-4 text-center font-medium border-l">選択コスト</th>
							<th className="p-4 text-center font-medium">損益</th>
							<th className="p-4 text-center font-medium border-l">ステータス</th>
						</tr>
					</thead>
					<tbody>
						{amountGroups.map((group, index) => (
							<AmountGroupRow
								key={`${group.amount}-${group.count}`}
								amountGroup={group}
								availableReturnItems={availableReturnItems}
								onUpdateGroup={(updatedGroup) => handleUpdateGroup(index, updatedGroup)}
								disabled={disabled}
							/>
						))}
					</tbody>
				</table>
			</ScrollArea>
		</div>
	);
}
