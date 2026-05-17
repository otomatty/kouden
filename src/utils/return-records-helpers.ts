/**
 * 返礼情報データ変換のヘルパー関数（純粋関数）
 * @module return-records-helpers
 *
 * このファイルは Server Action を呼び出さない、純粋なデータ変換ロジックに
 * 限定しています。bulk取得を伴うリスト変換は
 * `@/app/_actions/return-records/summaries` 側で行います。
 */

import type { EntryAmountStats } from "@/app/_actions/offerings/queries";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import {
	type ReturnEntryRecord,
	type ReturnItem,
	type ReturnManagementSummary,
	type ReturnStatus,
	isReturnItem,
} from "@/types/return-records/return-records";

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
 * ReturnEntryRecordをReturnManagementSummary形式に変換する（純粋関数）
 * @param returnRecord - 返礼エントリーレコード
 * @param entries - 香典エントリー一覧
 * @param relationships - 関係性一覧
 * @param koudenId - 香典帳ID
 * @param entryAmountsMap - 事前に一括計算した香典金額/お供物配分のMap
 * @returns ReturnManagementSummary
 */
export function convertToReturnManagementSummary(
	returnRecord: ReturnEntryRecord,
	entries: Entry[],
	relationships: Relationship[],
	koudenId: string,
	entryAmountsMap: Map<string, EntryAmountStats>,
): ReturnManagementSummary | null {
	const entry = entries.find((e) => e.id === returnRecord.kouden_entry_id);
	if (!entry) return null;

	// return_items は JSON カラムなので、型ガードで `ReturnItem` のみ通す
	const rawItems: unknown = returnRecord.return_items;
	const returnItems: ReturnItem[] = Array.isArray(rawItems) ? rawItems.filter(isReturnItem) : [];

	// 関係性名を取得
	const relationship = relationships.find((r) => r.id === entry.relationship_id);

	// 事前計算済みのお供物配分金額を参照（N+1回避）
	const stats = entryAmountsMap.get(entry.id);
	const offeringTotal = stats?.offering_total ?? 0;
	const totalAmount = stats?.calculated_total ?? entry.amount ?? 0;

	return {
		koudenId: koudenId,
		koudenEntryId: returnRecord.kouden_entry_id,
		entryName: entry.name || "",
		organization: entry.organization || "",
		entryPosition: entry.position || "",
		relationshipName: relationship?.name || "",
		koudenAmount: entry.amount || 0,
		offeringCount: entry.has_offering ? 1 : 0,
		offeringTotal: offeringTotal,
		totalAmount: totalAmount,
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
