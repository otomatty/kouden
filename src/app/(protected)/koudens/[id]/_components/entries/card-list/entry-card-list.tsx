"use client";

import { useState, useMemo, useEffect } from "react";
import { useAtomValue } from "jotai";
import type { KoudenEntry } from "@/types/kouden";
import { MobileFilters } from "./mobile-filters";
import { EntryCard } from "./entry-card";
import { entriesAtom } from "@/store/entries";

interface EntryCardListProps {
	entries: KoudenEntry[];
	koudenId: string;
}

export function EntryCardList({
	entries: initialEntries,
	koudenId,
}: EntryCardListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");

	// Jotaiのatomから最新のentriesを取得
	const currentEntries = useAtomValue(entriesAtom);
	const entries = currentEntries.length > 0 ? currentEntries : initialEntries;

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		console.log("Filtering with:", { searchQuery, searchField });
		let result = [...entries];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((entry) => {
				// 全ての検索可能なフィールドに対して検索を実行
				const searchFields = ["name", "address", "organization", "position"];
				return searchFields.some((field) => {
					const value = entry[field as keyof typeof entry];
					if (typeof value === "string") {
						const matches = value
							.toLowerCase()
							.includes(searchQuery.toLowerCase());
						console.log("Filtering entry:", { field, value, matches });
						return matches;
					}
					return false;
				});
			});
		}

		// ソートを適用
		const [field, order] = sortOrder.split("_");
		console.log("Sorting with:", { field, order });
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
	}, [entries, searchQuery, searchField, sortOrder]);

	// デバッグ用のログ出力
	useEffect(() => {
		console.log("EntryCardList Debug:", {
			searchQuery,
			searchField,
			sortOrder,
			entriesCount: entries.length,
			filteredCount: filteredAndSortedData.length,
		});
	}, [
		searchQuery,
		searchField,
		sortOrder,
		entries.length,
		filteredAndSortedData.length,
	]);

	return (
		<div className="flex flex-col h-[100vh]">
			<MobileFilters
				searchQuery={searchQuery}
				searchField={searchField}
				onSearchFieldChange={setSearchField}
				onSearchChange={setSearchQuery}
				sortOrder={sortOrder}
				onSortOrderChange={setSortOrder}
			/>
			<div className="flex-1 overflow-auto">
				<div className="space-y-2 py-4">
					{filteredAndSortedData.map((entry) => (
						<EntryCard key={entry.id} entry={entry} koudenId={koudenId} />
					))}
					{filteredAndSortedData.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							データがありません
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
