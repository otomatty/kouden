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
}

/**
 * EntryViewコンポーネント
 * 役割：エントリーの表示
 */
export function EntryView({
	koudenId,
	relationships = [],
	totalCount,
	currentPage,
	pageSize,
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

	// infinite scroll hook with filters
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
		if (!loadMoreRef.current) return;
		const observer = new IntersectionObserver(([e]) => {
			if (e?.isIntersecting && hasNextPage) fetchNextPage();
		});
		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	return (
		<>
			{isMobile ? (
				<>
					<EntryCardList
						entries={infiniteEntries}
						koudenId={koudenId}
						relationships={relationships}
					/>
				</>
			) : (
				<>
					<DataTable
						koudenId={koudenId}
						entries={infiniteEntries}
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
					/>
					<div ref={loadMoreRef} className="h-1" />
					{infiniteLoading && <Loading message="Loading..." />}
				</>
			)}
		</>
	);
}
