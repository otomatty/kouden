"use client";

import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import type { Offering } from "@/types/offerings";
import type { Entry } from "@//types/entries";
import { MobileFilters } from "./mobile-filters";
import { OfferingCard } from "./offering-card";
import { offeringsAtom } from "@/store/offerings";

interface OfferingCardListProps {
	offerings: Offering[];
	koudenId: string;
	entries: Entry[];
}

export function OfferingCardList({
	offerings: initialOfferings,
	koudenId,
	entries,
}: OfferingCardListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");

	// Jotaiのatomから最新のofferingsを取得
	const currentOfferings = useAtomValue(offeringsAtom);
	const offerings = currentOfferings.length > 0 ? currentOfferings : initialOfferings;
	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...offerings];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((offering) => {
				// お供物の検索可能なフィールドに対して検索を実行
				const searchFields = ["name", "note"];
				return searchFields.some((field) => {
					const value = offering[field as keyof typeof offering];
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
			if (field === "name") {
				return order === "desc"
					? (b.description || "").localeCompare(a.description || "")
					: (a.description || "").localeCompare(b.description || "");
			}
			return 0;
		});

		return result;
	}, [offerings, searchQuery, sortOrder]);

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
					{filteredAndSortedData.map((offering) => (
						<OfferingCard
							key={offering.id}
							offering={offering}
							koudenId={koudenId}
							entries={entries}
						/>
					))}
					{filteredAndSortedData.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">データがありません</div>
					)}
				</div>
			</div>
		</div>
	);
}
