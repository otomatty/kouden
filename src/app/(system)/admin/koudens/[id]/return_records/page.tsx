import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { notFound } from "next/navigation";
import { getReturnEntriesByKoudenPaginated } from "@/app/_actions/return-records/return-records";
import { getKoudenForAdmin } from "@/app/_actions/koudens/read";
import { getEntriesForAdmin } from "@/app/_actions/entries";
import { getRelationshipsForAdmin } from "@/app/_actions/relationships";
import { getReturnItems } from "@/app/_actions/return-records/return-items";
import ReturnRecordsPageClient from "@/app/(protected)/koudens/[id]/return_records/ReturnRecordsPageClient";
import type {
	ReturnItem,
	ReturnStatus,
	ReturnManagementSummary,
	ReturnEntryRecordWithKoudenEntry,
} from "@/types/return-records/return-records";

interface AdminReturnRecordsPageProps {
	params: Promise<{
		id: string;
	}>;
	searchParams: Promise<{
		search?: string;
		status?: string;
	}>;
}

/**
 * 管理者用返礼管理ページ
 * 役割：香典帳に紐づく返礼情報の管理画面を表示
 */
export default async function AdminReturnRecordsPage({
	params,
	searchParams,
}: AdminReturnRecordsPageProps) {
	const { id: koudenId } = await params;
	const { search, status } = await searchParams;

	// 管理者権限チェック
	await checkAdminPermission();

	// 香典帳の存在確認
	const kouden = await getKoudenForAdmin(koudenId);
	if (!kouden) {
		notFound();
	}

	// 必要なデータを並列取得（管理者用関数を使用）
	const [returnEntriesResult, { entries }, relationships, returnItems] = await Promise.all([
		getReturnEntriesByKoudenPaginated(koudenId, 100, undefined, { search, status }),
		getEntriesForAdmin(koudenId),
		getRelationshipsForAdmin(koudenId),
		getReturnItems(koudenId),
	]);

	const returnEntries: ReturnEntryRecordWithKoudenEntry[] = returnEntriesResult.data;

	// ReturnManagementSummary形式に変換（コンポーネントが期待する形式）
	const initialReturns: ReturnManagementSummary[] = returnEntries.map((entry) => ({
		koudenId: koudenId,
		koudenEntryId: entry.kouden_entry_id,
		entryName: entry.kouden_entries.name || "不明",
		organization: entry.kouden_entries.organization || "",
		entryPosition: entry.kouden_entries.position || "",
		relationshipName: "", // 関係性は別途マッピングが必要
		koudenAmount: entry.kouden_entries.amount || 0,
		offeringCount: 0,
		offeringTotal: 0,
		totalAmount: entry.kouden_entries.amount || 0,
		returnStatus: (entry.return_status as ReturnStatus) || "PENDING",
		funeralGiftAmount: entry.funeral_gift_amount || 0,
		additionalReturnAmount: entry.additional_return_amount || 0,
		returnMethod: entry.return_method || "",
		returnItems: [],
		arrangementDate: entry.arrangement_date || "",
		remarks: entry.remarks || "",
		returnRecordCreated: entry.created_at,
		returnRecordUpdated: entry.updated_at,
		statusDisplay: entry.return_status,
		needsAdditionalReturn: (entry.additional_return_amount || 0) > 0,
		shippingPostalCode: entry.shipping_postal_code || undefined,
		shippingAddress: entry.shipping_address || undefined,
		shippingPhoneNumber: entry.shipping_phone_number || undefined,
		returnItemsCost: entry.return_items_cost || 0,
		profitLoss: entry.profit_loss || 0,
	}));

	return (
		<div className="container mx-auto py-6 space-y-6">
			<ReturnRecordsPageClient
				koudenId={koudenId}
				initialReturns={initialReturns}
				entries={entries}
				relationships={relationships}
				initialHasMore={returnEntriesResult.hasMore}
				initialCursor={returnEntriesResult.nextCursor}
				returnItems={returnItems}
			/>
		</div>
	);
}
