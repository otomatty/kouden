import { notFound } from "next/navigation";
import { getReturnEntriesByKoudenPaginated } from "@/app/_actions/return-records/return-records";
import { getKouden } from "@/app/_actions/koudens";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";
import { getReturnItems } from "@/app/_actions/return-records/return-items";
import ReturnRecordsPageClient from "./ReturnRecordsPageClient";
import type {
	ReturnManagementSummary,
	ReturnItem,
	ReturnStatus,
} from "@/types/return-records/return-records";

interface ReturnRecordsPageProps {
	params: Promise<{
		id: string;
	}>;
	searchParams: Promise<{
		search?: string;
		status?: string;
	}>;
}

/**
 * 返礼管理ページ
 * 役割：香典帳に紐づく返礼情報の管理画面（無限スクロール対応）
 */
export default async function ReturnRecordsPage({ params, searchParams }: ReturnRecordsPageProps) {
	const { id: koudenId } = await params;
	const resolvedSearchParams = await searchParams;

	// 初期フィルター設定
	const initialFilters = {
		search: resolvedSearchParams.search,
		status: resolvedSearchParams.status !== "all" ? resolvedSearchParams.status : undefined,
	};

	try {
		// 並行データ取得
		const [koudenDetails, entriesResult, relationships, initialReturns, returnItems] =
			await Promise.all([
				getKouden(koudenId),
				getEntries(koudenId),
				getRelationships(koudenId),
				getReturnEntriesByKoudenPaginated(koudenId, 100, undefined, initialFilters),
				getReturnItems(koudenId),
			]);

		if (!koudenDetails) {
			notFound();
		}

		const entries = entriesResult;

		// 返礼管理サマリーの型に変換
		const returnSummaries = initialReturns.data
			.map((returnRecord) => {
				const entry = entries.entries.find((e) => e.id === returnRecord.kouden_entry_id);
				if (!entry) return null;

				// return_itemsの型安全な変換
				const returnItems: ReturnItem[] = Array.isArray(returnRecord.return_items)
					? (returnRecord.return_items as unknown as ReturnItem[])
					: [];

				return {
					koudenId: koudenId,
					koudenEntryId: returnRecord.kouden_entry_id,
					entryName: entry.name || "",
					organization: entry.organization || "",
					entryPosition: entry.position || "",
					relationshipName: entry.relationship?.name || "",
					koudenAmount: entry.amount || 0,
					offeringCount: entry.has_offering ? 1 : 0,
					offeringTotal: entry.has_offering ? 1000 : 0, // 仮の値
					totalAmount: (entry.amount || 0) + (entry.has_offering ? 1000 : 0),
					returnStatus: returnRecord.return_status as ReturnStatus,
					funeralGiftAmount: returnRecord.funeral_gift_amount || 0,
					additionalReturnAmount: returnRecord.additional_return_amount || 0,
					returnMethod: returnRecord.return_method || "",
					returnItems: returnItems,
					arrangementDate: returnRecord.arrangement_date || "",
					remarks: returnRecord.remarks || "",
					returnRecordCreated: returnRecord.created_at,
					returnRecordUpdated: returnRecord.updated_at,
					statusDisplay: returnRecord.return_status,
					needsAdditionalReturn: (returnRecord.additional_return_amount || 0) > 0,
					shippingPostalCode: returnRecord.shipping_postal_code || undefined,
					shippingAddress: returnRecord.shipping_address || undefined,
					shippingPhoneNumber: returnRecord.shipping_phone_number || undefined,
					returnItemsCost: returnRecord.return_items_cost || 0,
					profitLoss: returnRecord.profit_loss || 0,
				} satisfies ReturnManagementSummary;
			})
			.filter((item) => item !== null) as ReturnManagementSummary[];

		return (
			<div className="mt-4">
				<ReturnRecordsPageClient
					koudenId={koudenId}
					initialReturns={returnSummaries}
					entries={entries.entries}
					relationships={relationships || []}
					initialHasMore={initialReturns.hasMore}
					initialCursor={initialReturns.nextCursor}
					returnItems={returnItems}
				/>
			</div>
		);
	} catch (error) {
		console.error("返礼管理ページの初期化エラー:", error);
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center justify-center py-8">
					<p className="text-destructive mb-4">データの読み込みに失敗しました</p>
					<p className="text-sm text-muted-foreground">ページを再読み込みしてください</p>
				</div>
			</div>
		);
	}
}
