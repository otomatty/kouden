"use client";

import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import type { Offering } from "@/types/offerings";
import type { Entry } from "@/types/entries";
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
	const [searchField, setSearchField] = useState("providerName");
	const [sortOrder, setSortOrder] = useState("created_at_desc");

	// Jotaiのatomから最新のofferingsを取得
	const [offerings, setOfferings] = useAtom(offeringsAtom);

	// 初期表示時にinitialOfferingsをatomに設定
	useEffect(() => {
		if (offerings.length === 0 && initialOfferings.length > 0) {
			setOfferings(initialOfferings);
		}
	}, [initialOfferings, offerings.length, setOfferings]);

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...offerings];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((offering) => {
				// お供物の検索可能なフィールドに対して検索を実行
				const searchFields = ["providerName", "description", "notes"];
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
			if (field === "price") {
				const priceA = a.price || 0;
				const priceB = b.price || 0;
				return order === "desc" ? priceB - priceA : priceA - priceB;
			}
			if (field === "providerName") {
				return order === "desc"
					? (b.providerName || "").localeCompare(a.providerName || "")
					: (a.providerName || "").localeCompare(b.providerName || "");
			}
			return 0;
		});

		return result;
	}, [offerings, searchQuery, sortOrder]);

	return (
		<div className="flex flex-col">
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
