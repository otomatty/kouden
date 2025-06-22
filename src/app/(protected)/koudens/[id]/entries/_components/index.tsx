"use client";
// library
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { DataTable } from "./table/data-table";
import { EntryCardList } from "./card-list/entry-card-list";
import { Loading } from "@/components/custom/loading";
import { useInfiniteEntries } from "@/hooks/use-infinite-entries";

// Props
interface EntryViewProps {
	entries: Entry[];
	koudenId: string;
	relationships: Relationship[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
	isAdminMode?: boolean;
}

/**
 * EntryViewコンポーネント
 * 役割：エントリーの表示
 */
export function EntryView({
	entries: serverEntries,
	koudenId,
	relationships = [],
	totalCount,
	currentPage,
	pageSize,
	isAdminMode = false,
}: EntryViewProps) {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Local filter and scope state
	const [searchInput, setSearchInput] = useState<string>("");
	const [sortValue, setSortValue] = useState<string>("default");
	const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
	const [selectedMemberIds, _setSelectedMemberIds] = useState<string[]>([]);
	// filter for showing duplicates
	const [showDuplicates, _setShowDuplicates] = useState<boolean>(false);

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	// infinite scroll hook with filters (通常モードのみ)
	const {
		entries: infiniteEntries,
		isLoading: infiniteLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteEntries({
		koudenId,
		pageSize,
		// server-side member filter
		memberIds: selectedMemberIds,
		search: searchInput,
		sort: sortValue,
		dateFrom: dateRange.from?.toISOString().slice(0, 10),
		dateTo: dateRange.to?.toISOString().slice(0, 10),
		isDuplicate: showDuplicates,
	});
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!loadMoreRef.current || isAdminMode) return; // 管理者モードでは無限スクロール無効
		const observer = new IntersectionObserver(([e]) => {
			if (e?.isIntersecting && hasNextPage) fetchNextPage();
		});
		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isAdminMode]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	// 管理者モードではサーバーサイドのデータを使用、通常モードでは無限スクロールのデータを使用
	const displayEntries = isAdminMode ? serverEntries : infiniteEntries;

	console.log("[DEBUG] EntryView - Display data:", {
		isAdminMode,
		serverEntriesCount: serverEntries.length,
		infiniteEntriesCount: infiniteEntries.length,
		displayEntriesCount: displayEntries.length,
		totalCount,
	});

	return (
		<>
			{isMobile ? (
				<>
					<EntryCardList
						entries={displayEntries}
						koudenId={koudenId}
						relationships={relationships}
					/>
				</>
			) : (
				<>
					<div data-tour="entries-table">
						<DataTable
							koudenId={koudenId}
							entries={displayEntries}
							duplicateFilter={showDuplicates}
							onDuplicateFilterChange={_setShowDuplicates}
							relationships={Array.isArray(relationships) ? relationships : []}
							onDataChange={() => {}}
							currentPage={currentPage}
							pageSize={pageSize}
							totalCount={totalCount}
							onPageChange={() => {}}
							onPageSizeChange={() => {}}
							searchValue={searchInput}
							onSearchChange={setSearchInput}
							sortValue={sortValue}
							onSortChange={setSortValue}
							// date filter props
							showDateFilter={true}
							dateRange={dateRange}
							onDateRangeChange={setDateRange}
							isAdminMode={isAdminMode}
						/>
					</div>
					{!isAdminMode && (
						<>
							<div ref={loadMoreRef} className="h-1" />
							{infiniteLoading && <Loading message="読み込み中..." />}
						</>
					)}
				</>
			)}
		</>
	);
}
