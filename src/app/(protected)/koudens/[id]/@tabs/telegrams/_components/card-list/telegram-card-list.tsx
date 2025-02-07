"use client";

import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import type { Telegram } from "@/types/telegrams";
import type { Entry } from "@/types/entries";
import { MobileFilters } from "./mobile-filters";
import { TelegramCard } from "./telegram-card";
import { telegramsAtom } from "@/store/telegrams";

interface TelegramCardListProps {
	telegrams: Telegram[];
	koudenId: string;
	entries: Entry[];
}

export function TelegramCardList({
	telegrams: initialTelegrams,
	koudenId,
	entries,
}: TelegramCardListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("senderName");
	const [sortOrder, setSortOrder] = useState("created_at_desc");

	// Jotaiのatomから最新のtelegramsを取得
	const [telegrams, setTelegrams] = useAtom(telegramsAtom);

	// 初期表示時にinitialTelegramsをatomに設定
	useEffect(() => {
		if (telegrams.length === 0 && initialTelegrams.length > 0) {
			setTelegrams(initialTelegrams);
		}
	}, [initialTelegrams, telegrams.length, setTelegrams]);

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...telegrams];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((telegram) => {
				// 全ての検索可能なフィールドに対して検索を実行
				const searchFields = ["senderName", "senderOrganization", "senderPosition", "message"];
				return searchFields.some((field) => {
					const value = telegram[field as keyof typeof telegram];
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
					? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					: new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}
			if (field === "senderName") {
				return order === "desc"
					? (b.senderName || "").localeCompare(a.senderName || "")
					: (a.senderName || "").localeCompare(b.senderName || "");
			}
			if (field === "senderOrganization") {
				return order === "desc"
					? (b.senderOrganization || "").localeCompare(a.senderOrganization || "")
					: (a.senderOrganization || "").localeCompare(b.senderOrganization || "");
			}
			return 0;
		});

		return result;
	}, [telegrams, searchQuery, sortOrder]);

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
					{filteredAndSortedData.map((telegram) => (
						<TelegramCard
							key={telegram.id}
							telegram={telegram}
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
