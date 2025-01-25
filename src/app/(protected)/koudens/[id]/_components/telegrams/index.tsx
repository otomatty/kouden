"use client";

import { useState, useMemo } from "react";
import { DataTable } from "./table/data-table";
import { createColumns } from "./table/columns";
import { useTelegrams } from "@/hooks/useTelegrams";
import type { Telegram } from "@/types/telegram";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileFilters } from "./card-list/mobile-filters";
import { TelegramCard } from "./card-list/telegram-card";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

interface TelegramsViewProps {
	telegrams: Telegram[];
	koudenId: string;
}

export function TelegramsView({ telegrams, koudenId }: TelegramsViewProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("sender_name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");
	const { deleteTelegram, updateTelegram } = useTelegrams(koudenId);

	const [selectedRows, setSelectedRows] = useState<string[]>([]);

	const handleDeleteSelectedRows = async (ids: string[]) => {
		for (const id of ids) {
			await deleteTelegram(id);
		}
	};

	// モバイルビューかどうかを判定
	const isMobile = useMediaQuery("(max-width: 767px)");

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...(telegrams || [])];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((telegram) => {
				const value = telegram[searchField as keyof typeof telegram];
				if (typeof value === "string") {
					return value.toLowerCase().includes(searchQuery.toLowerCase());
				}
				return false;
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
			if (field === "sender_name") {
				const nameA = a.senderName || "";
				const nameB = b.senderName || "";
				return order === "desc"
					? nameB.localeCompare(nameA)
					: nameA.localeCompare(nameB);
			}
			return 0;
		});

		return result;
	}, [telegrams, searchQuery, searchField, sortOrder]);

	const columns = createColumns({
		onEditRow: async (telegram: Telegram) => {
			const { id, createdAt, updatedAt, ...rest } = telegram;
			const data = {
				senderName: rest.senderName,
				senderOrganization: rest.senderOrganization || undefined,
				senderPosition: rest.senderPosition || undefined,
				message: rest.message || undefined,
				notes: rest.notes || undefined,
				koudenEntryId: rest.koudenEntryId || undefined,
			};
			await updateTelegram(id, data);
		},
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		koudenEntries: [],
	});

	const table = useReactTable({
		data: filteredAndSortedData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<>
			{isMobile ? (
				<div className="flex flex-col h-[100vh]">
					<MobileFilters
						searchQuery={searchQuery}
						onSearchChange={(value) => setSearchQuery(value)}
						searchField={searchField}
						onSearchFieldChange={(value) => setSearchField(value)}
						sortOrder={sortOrder}
						onSortOrderChange={(value) => setSortOrder(value)}
						table={table}
					/>
					<div className="flex-1 overflow-auto">
						<div className="space-y-2 py-4">
							{filteredAndSortedData.map((telegram) => (
								<TelegramCard
									key={telegram.id}
									telegram={telegram}
									onDelete={async () => {
										await handleDeleteSelectedRows([telegram.id]);
									}}
								/>
							))}
							{filteredAndSortedData.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									データがありません
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={filteredAndSortedData}
					koudenId={koudenId}
					koudenEntries={[]}
				/>
			)}
		</>
	);
}
