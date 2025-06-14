/**
 * 一括更新用のヘルパー関数
 * @module bulk-update-helpers
 */

import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { AmountGroupData } from "@/types/return-records/bulk-update";

/**
 * 返礼記録を金額ベースでグループ化する
 * @param records - 返礼記録配列
 * @returns 金額グループデータ配列
 */
export function groupRecordsByAmount(records: ReturnManagementSummary[]): AmountGroupData[] {
	// 金額ごとにグループ化
	const amountMap = new Map<number, string[]>();

	for (const record of records) {
		const amount = record.totalAmount;
		if (!amountMap.has(amount)) {
			amountMap.set(amount, []);
		}
		amountMap.get(amount)?.push(record.koudenEntryId);
	}

	// AmountGroupData配列に変換
	const amountGroups: AmountGroupData[] = [];

	amountMap.forEach((entryIds, amount) => {
		amountGroups.push({
			amount,
			count: entryIds.length,
			entryIds,
			selectedReturnItemIds: [],
			status: "PENDING", // デフォルトステータス
		});
	});

	// 金額順でソート
	return amountGroups.sort((a, b) => a.amount - b.amount);
}

/**
 * 金額グループデータから更新対象のエントリーIDを取得
 * @param amountGroups - 金額グループデータ配列
 * @returns 更新対象のエントリーID配列
 */
export function getTargetEntryIds(amountGroups: AmountGroupData[]): string[] {
	return amountGroups.flatMap((group) => group.entryIds);
}

/**
 * 選択された返礼品の総コストを計算
 * @param selectedItemIds - 選択された返礼品ID配列
 * @param availableItems - 利用可能な返礼品配列
 * @returns 総コスト
 */
export function calculateSelectedItemsCost(
	selectedItemIds: string[],
	availableItems: Array<{ id: string; price: number }>,
): number {
	return selectedItemIds.reduce((total, itemId) => {
		const item = availableItems.find((item) => item.id === itemId);
		return total + (item?.price || 0);
	}, 0);
}

/**
 * 金額グループの統計情報を計算
 * @param amountGroups - 金額グループデータ配列
 * @returns 統計情報
 */
export function calculateGroupStatistics(amountGroups: AmountGroupData[]) {
	const totalEntries = amountGroups.reduce((sum, group) => sum + group.count, 0);
	const totalAmount = amountGroups.reduce((sum, group) => sum + group.amount * group.count, 0);
	const uniqueAmounts = amountGroups.length;

	return {
		totalEntries,
		totalAmount,
		uniqueAmounts,
	};
}
