import { useState, useEffect, useCallback } from "react";
import type { Entry } from "@/types/entries";

interface UseInfiniteEntriesOptions {
	koudenId: string;
	pageSize?: number;
	memberIds?: string[];
	search?: string;
	sort?: string;
	dateFrom?: string;
	dateTo?: string;
	isDuplicate?: boolean;
}

interface UseInfiniteEntriesResult {
	entries: Entry[];
	totalCount: number;
	isLoading: boolean;
	isError: boolean;
	fetchNextPage: () => void;
	hasNextPage: boolean;
}

export function useInfiniteEntries({
	koudenId,
	pageSize = 50,
	memberIds,
	search,
	sort,
	dateFrom,
	dateTo,
	isDuplicate,
}: UseInfiniteEntriesOptions): UseInfiniteEntriesResult {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);

	const fetchPage = useCallback(
		async (pageToFetch: number) => {
			setIsLoading(true);
			try {
				const params = new URLSearchParams();
				params.set("page", String(pageToFetch));
				params.set("pageSize", String(pageSize));
				if (memberIds && memberIds.length > 0) params.set("memberIds", memberIds.join(","));
				if (search) params.set("search", search);
				if (sort) params.set("sort", sort);
				if (dateFrom) params.set("dateFrom", dateFrom);
				if (dateTo) params.set("dateTo", dateTo);
				if (isDuplicate) params.set("isDuplicate", "true");

				const res = await fetch(`/api/koudens/${koudenId}/entries?${params.toString()}`);
				const json = await res.json();
				const { entries: newEntries, count } = json;

				setEntries((prev) => (pageToFetch === 1 ? newEntries : [...prev, ...newEntries]));
				setTotalCount(count);
				setIsError(false);
			} catch (err) {
				console.error("[useInfiniteEntries] fetch error", err);
				setIsError(true);
			} finally {
				setIsLoading(false);
			}
		},
		[koudenId, pageSize, memberIds, search, sort, dateFrom, dateTo, isDuplicate],
	);

	useEffect(() => {
		// Reset and fetch first page when filters change
		setPage(1);
		fetchPage(1);
	}, [fetchPage]);

	const fetchNextPage = useCallback(() => {
		if (isLoading || entries.length >= totalCount) return;
		const next = page + 1;
		setPage(next);
		fetchPage(next);
	}, [entries.length, totalCount, isLoading, page, fetchPage]);

	const hasNextPage = entries.length < totalCount;

	return { entries, totalCount, isLoading, isError, fetchNextPage, hasNextPage };
}
