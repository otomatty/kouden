"use client";

// library
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTransition } from "react";
// types
import type {
	ReturnManagementSummary,
	ReturnItem,
	ReturnStatus,
	ReturnEntryRecord,
} from "@/types/return-records/return-records";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
// actions
import { getReturnEntriesByKoudenPaginated } from "@/app/_actions/return-records/return-records";
// components
import { DataTable } from "./table/data-table";
import { ReturnCardList } from "./card-list/return-card-list";
import { Loading } from "@/components/custom/loading";

// Props
interface ReturnRecordsViewProps {
	initialReturns: ReturnManagementSummary[];
	entries: Entry[];
	koudenId: string;
	relationships: Relationship[];
	initialHasMore: boolean;
	initialCursor?: string;
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
}

/**
 * ReturnRecordsViewコンポーネント
 * 役割：返礼管理の無限スクロール表示
 */
export function ReturnRecordsView({
	initialReturns,
	entries,
	koudenId,
	relationships = [],
	initialHasMore,
	initialCursor,
	onEditReturn,
}: ReturnRecordsViewProps) {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Local filter state
	const [searchInput, setSearchInput] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// 無限スクロール用のロード関数
	const loadMoreReturns = useCallback(
		async (cursor?: string) => {
			const filters = {
				search: searchInput || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			};

			const result = await getReturnEntriesByKoudenPaginated(koudenId, 100, cursor, filters);

			// データを ReturnManagementSummary 形式に変換
			const summaries = result.data
				.map((returnRecord: ReturnEntryRecord) => {
					const entry = entries.find((e: Entry) => e.id === returnRecord.kouden_entry_id);
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

			return {
				data: summaries,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
			};
		},
		[koudenId, entries, searchInput, statusFilter],
	);

	const {
		data: returns,
		hasMore,
		isLoading,
		error,
		refresh,
		updateItemOptimistic,
		lastElementRef,
	} = useInfiniteScroll<ReturnManagementSummary>({
		loadMore: loadMoreReturns,
		initialData: initialReturns,
		initialHasMore,
		initialCursor,
	});

	// フィルターが変更されたときのリフレッシュ
	useEffect(() => {
		if (isClient) {
			startTransition(() => {
				refresh();
			});
		}
	}, [isClient, refresh]);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<p className="text-destructive mb-4">データの読み込みに失敗しました</p>
				<p className="text-sm text-muted-foreground mb-4">{error}</p>
				<button
					type="button"
					onClick={() => refresh()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
				>
					再試行
				</button>
			</div>
		);
	}

	return (
		<>
			{isMobile ? (
				<ReturnCardList
					returns={returns}
					koudenId={koudenId}
					relationships={relationships}
					searchValue={searchInput}
					onSearchChange={setSearchInput}
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
					hasMore={hasMore}
					isLoading={isLoading || isPending}
					lastElementRef={lastElementRef}
					onEditReturn={onEditReturn}
				/>
			) : (
				<DataTable
					koudenId={koudenId}
					entries={entries}
					returns={returns}
					relationships={Array.isArray(relationships) ? relationships : []}
					onDataChange={refresh}
					onOptimisticUpdate={updateItemOptimistic}
					searchValue={searchInput}
					onSearchChange={setSearchInput}
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
					hasMore={hasMore}
					isLoading={isLoading || isPending}
					lastElementRef={lastElementRef}
					onEditReturn={onEditReturn}
				/>
			)}
		</>
	);
}
