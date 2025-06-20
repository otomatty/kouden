/**
 * 返礼情報データ変換のヘルパー関数
 * @module return-records-helpers
 */

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type {
	ReturnEntryRecord,
	ReturnManagementSummary,
	ReturnStatus,
	ReturnItem,
} from "@/types/return-records/return-records";
import { calculateEntryTotalAmount } from "@/app/_actions/offerings/queries";

/**
 * 返礼状況の表示用テキストを取得
 */
function getStatusDisplay(status: ReturnStatus): string {
	switch (status) {
		case "PENDING":
			return "未返礼";
		case "PARTIAL_RETURNED":
			return "一部返礼";
		case "COMPLETED":
			return "返礼完了";
		case "NOT_REQUIRED":
			return "返礼不要";
		default:
			return "不明";
	}
}

/**
 * ReturnEntryRecordをReturnManagementSummary形式に変換する
 * @param returnRecord - 返礼エントリーレコード
 * @param entries - 香典エントリー一覧
 * @param relationships - 関係性一覧
 * @param koudenId - 香典帳ID
 * @returns ReturnManagementSummary
 */
export async function convertToReturnManagementSummary(
	returnRecord: ReturnEntryRecord,
	entries: Entry[],
	relationships: Relationship[],
	koudenId: string,
): Promise<ReturnManagementSummary | null> {
	const entry = entries.find((e) => e.id === returnRecord.kouden_entry_id);
	if (!entry) return null;

	// return_itemsの型安全な変換
	const returnItems: ReturnItem[] = Array.isArray(returnRecord.return_items)
		? (returnRecord.return_items as unknown as ReturnItem[])
		: [];

	// 関係性名を取得
	const relationship = relationships.find((r) => r.id === entry.relationship_id);

	// 実際のお供物配分金額を取得
	const entryTotalAmountResult = await calculateEntryTotalAmount(entry.id);
	let offeringTotal = 0;
	let totalAmount = entry.amount || 0;

	if (entryTotalAmountResult.success && entryTotalAmountResult.data) {
		offeringTotal = entryTotalAmountResult.data.offering_total;
		totalAmount = entryTotalAmountResult.data.calculated_total;
	}

	return {
		koudenId: koudenId,
		koudenEntryId: returnRecord.kouden_entry_id,
		entryName: entry.name || "",
		organization: entry.organization || "",
		entryPosition: entry.position || "",
		relationshipName: relationship?.name || "",
		koudenAmount: entry.amount || 0,
		offeringCount: entry.has_offering ? 1 : 0,
		offeringTotal: offeringTotal, // 実際の配分金額を使用
		totalAmount: totalAmount, // 実際の合計金額を使用
		returnStatus: returnRecord.return_status as ReturnStatus,
		funeralGiftAmount: returnRecord.funeral_gift_amount || 0,
		additionalReturnAmount: returnRecord.additional_return_amount || 0,
		returnMethod: returnRecord.return_method || "",
		returnItems: returnItems,
		arrangementDate: returnRecord.arrangement_date || "",
		shippingPostalCode: returnRecord.shipping_postal_code || "",
		shippingAddress: returnRecord.shipping_address || "",
		shippingPhoneNumber: returnRecord.shipping_phone_number || "",
		remarks: returnRecord.remarks || "",
		returnItemsCost: returnRecord.return_items_cost || 0,
		profitLoss: returnRecord.profit_loss || 0,
		returnRecordCreated: returnRecord.created_at,
		returnRecordUpdated: returnRecord.updated_at,
		statusDisplay: getStatusDisplay(returnRecord.return_status as ReturnStatus),
		needsAdditionalReturn: (returnRecord.additional_return_amount || 0) > 0,
	};
}

/**
 * 複数のReturnEntryRecordを一括でReturnManagementSummary形式に変換する
 * @param returnRecords - 返礼エントリーレコード配列
 * @param entries - 香典エントリー一覧
 * @param relationships - 関係性一覧
 * @param koudenId - 香典帳ID
 * @returns ReturnManagementSummary配列
 */
export async function convertToReturnManagementSummaries(
	returnRecords: ReturnEntryRecord[],
	entries: Entry[],
	relationships: Relationship[],
	koudenId: string,
): Promise<ReturnManagementSummary[]> {
	const results = await Promise.all(
		returnRecords.map(async (record) => {
			return await convertToReturnManagementSummary(record, entries, relationships, koudenId);
		}),
	);

	return results.filter((summary): summary is ReturnManagementSummary => summary !== null);
}
