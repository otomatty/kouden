"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Entry } from "@/types/entries";
import { useInfiniteEntries } from "@/hooks/use-infinite-entries";
import { MobileFilters, filterOptions } from "./mobile-filters";
import { EntryCard } from "./entry-card";
import type { Relationship } from "@/types/relationships";
import { ArrowDown } from "lucide-react";

interface EntryCardListProps {
	entries: Entry[];
	koudenId: string;
	relationships: Relationship[];
}

export function EntryCardList({ koudenId, relationships }: EntryCardListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");
	const [filterColumn, setFilterColumn] = useState<string>(filterOptions[0]?.value || "");

	// Server-side paginated entries (100 per page)
	const { entries, isLoading, fetchNextPage, hasNextPage } = useInfiniteEntries({
		koudenId,
		pageSize: 100,
		filter: filterColumn,
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

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...entries];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((entry) => {
				// 全ての検索可能なフィールドに対して検索を実行
				const searchFields = ["name", "address", "organization", "position"];
				return searchFields.some((field) => {
					const value = entry[field as keyof typeof entry];
					if (typeof value === "string") {
						const matches = value.toLowerCase().includes(searchQuery.toLowerCase());
						return matches;
					}
					return false;
				});
			});
		}

		// ソートを適用
		const [field, order] = sortOrder.split("_");
		result.sort((a, b) => {
			if (field === "created_at") {
				return order === "desc"
					? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					: new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			}
			if (field === "amount") {
				return order === "desc" ? b.amount - a.amount : a.amount - b.amount;
			}
			if (field === "name") {
				return order === "desc"
					? (b.name || "").localeCompare(a.name || "")
					: (a.name || "").localeCompare(b.name || "");
			}
			return 0;
		});

		return result;
	}, [entries, searchQuery, sortOrder]);

	return (
		<div className="flex flex-col">
			<MobileFilters
				searchQuery={searchQuery}
				searchField={searchField}
				onSearchFieldChange={setSearchField}
				onSearchChange={setSearchQuery}
				sortOrder={sortOrder}
				onSortOrderChange={setSortOrder}
				filterColumn={filterColumn}
				onFilterColumnChange={setFilterColumn}
			/>
			<div className="flex-1 overflow-auto">
				<div className="space-y-2 pt-4">
					{filteredAndSortedData.map((entry) => (
						<EntryCard
							key={entry.id}
							entry={entry}
							koudenId={koudenId}
							relationships={relationships}
						/>
					))}
					<div ref={loadMoreRef} className="h-1" />
					{isLoading && <div className="text-center py-4">読み込み中...</div>}
					{filteredAndSortedData.length === 0 && (
						<div className="text-center py-8 text-muted-foreground h-[40vh] flex flex-col justify-between items-center">
							<span className="font-semibold">
								データがありません。
								<br />
								「香典を登録」ボタンをクリックして追加してください。
							</span>
							<ArrowDown className="h-8 w-8 mx-auto" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
