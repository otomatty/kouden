/**
 * 一括更新機能の型定義
 * @module bulk-update
 */

import type { ReturnStatus } from "./return-records";

/**
 * 金額グループのデータ
 */
export interface AmountGroupData {
	/** 金額 */
	amount: number;
	/** 該当件数 */
	count: number;
	/** 対象エントリーID配列 */
	entryIds: string[];
	/** 選択された返礼品ID配列 */
	selectedReturnItemIds: string[];
	/** 設定するステータス */
	status: ReturnStatus;
}

/**
 * 返礼品マスタ情報
 */
export interface ReturnItemMaster {
	/** 返礼品ID */
	id: string;
	/** 返礼品名 */
	name: string;
	/** 価格 */
	price: number;
	/** 説明 */
	description: string | null;
	/** 香典帳ID */
	kouden_id: string;
}

/**
 * 一括更新の設定
 */
export interface BulkUpdateTableConfig {
	/** 金額グループデータ */
	amountGroups: AmountGroupData[];
	/** 利用可能な返礼品マスタ */
	availableReturnItems: ReturnItemMaster[];
}

/**
 * 一括更新の実行データ
 */
export interface BulkUpdateExecutionData {
	/** 更新対象のエントリーID配列 */
	entryIds: string[];
	/** 設定する返礼品ID配列 */
	returnItemIds: string[];
	/** 設定するステータス */
	status: ReturnStatus;
	/** 返礼方法 */
	returnMethod?: string;
}

/**
 * 一括更新の結果
 */
export interface BulkUpdateResult {
	/** 更新成功件数 */
	successCount: number;
	/** 更新失敗件数 */
	failureCount: number;
	/** エラーメッセージ */
	errors?: string[];
}
