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
// utils
import { convertToReturnManagementSummaries } from "@/utils/return-records-helpers";
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

			// データを ReturnManagementSummary 形式に変換（実際のお供物配分金額を取得）
			const summaries = await convertToReturnManagementSummaries(
				result.data,
				entries,
				relationships,
				koudenId,
			);

			return {
				data: summaries,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
			};
		},
		[koudenId, entries, searchInput, statusFilter, relationships],
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
