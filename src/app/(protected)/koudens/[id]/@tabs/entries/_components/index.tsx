"use client";
// library
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { DataTable } from "./table/data-table";
import { EntryCardList } from "./card-list/entry-card-list";
import { Loading } from "@/components/custom/loading";
import { FloatingPagination } from "@/components/ui/floating-pagination";

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
	entries = [],
	koudenId,
	relationships = [],
	totalCount,
	currentPage,
	pageSize,
}: EntryViewProps) {
	const [data, setData] = useState<Entry[]>(entries);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const urlSearch = searchParams.get("search") || "";
	const sortValue = searchParams.get("sort") || "";
	const urlDateFrom = searchParams.get("dateFrom") || "";
	const urlDateTo = searchParams.get("dateTo") || "";
	// Local state for input and its debounced value
	const [searchInput, setSearchInput] = useState<string>(urlSearch);
	const debouncedSearch = useDebounce(searchInput, 300);
	// Local state for date range filter
	const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
		from: urlDateFrom ? new Date(urlDateFrom) : undefined,
		to: urlDateTo ? new Date(urlDateTo) : undefined,
	});
	// Sync local input when URL param changes (e.g. back/forward)
	useEffect(() => {
		setSearchInput(urlSearch);
		// sync dateRange when URL param changes
		setDateRange({
			from: urlDateFrom ? new Date(urlDateFrom) : undefined,
			to: urlDateTo ? new Date(urlDateTo) : undefined,
		});
	}, [urlSearch, urlDateFrom, urlDateTo]);
	// Effect to update URL when debounced value changes
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (debouncedSearch) {
			params.set("search", debouncedSearch);
		} else {
			params.delete("search");
		}
		params.set("page", "1");
		router.replace(`${pathname}?${params.toString()}`);
	}, [debouncedSearch, searchParams, pathname, router]);
	const handleSearchChange = (value: string) => {
		setSearchInput(value);
	};
	const handleSortChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value && value !== "default") {
			params.set("sort", value);
		} else {
			params.delete("sort");
		}
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};
	const totalPages = Math.ceil(totalCount / pageSize);
	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(newPage));
		params.set("pageSize", String(pageSize));
		router.push(`${pathname}?${params.toString()}`);
	};
	const handlePageSizeChange = (newSize: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("pageSize", String(newSize));
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};
	// handle date range change
	const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
		setDateRange(range);
		const params = new URLSearchParams(searchParams.toString());
		if (range.from) {
			params.set("dateFrom", range.from.toISOString().slice(0, 10));
		} else {
			params.delete("dateFrom");
		}
		if (range.to) {
			params.set("dateTo", range.to.toISOString().slice(0, 10));
		} else {
			params.delete("dateTo");
		}
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(entries)) {
			console.error("Invalid entries data:", entries);
			return;
		}
		setData(entries);
	}, [entries]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<>
					<EntryCardList entries={data} koudenId={koudenId} relationships={relationships} />
					<div className="mt-4 flex justify-center">
						<FloatingPagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalCount={totalCount}
							pageSize={pageSize}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
						/>
					</div>
				</>
			) : (
				<DataTable
					koudenId={koudenId}
					entries={Array.isArray(data) ? data : []}
					relationships={Array.isArray(relationships) ? relationships : []}
					onDataChange={setData}
					currentPage={currentPage}
					pageSize={pageSize}
					totalCount={totalCount}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
					searchValue={searchInput}
					onSearchChange={handleSearchChange}
					sortValue={sortValue}
					onSortChange={handleSortChange}
					// date filter props
					showDateFilter={true}
					dateRange={dateRange}
					onDateRangeChange={handleDateRangeChange}
				/>
			)}
		</>
	);
}
