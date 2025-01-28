"use client";

import { useState, useMemo } from "react";
import { DataTable } from "./table/data-table";
import { createColumns } from "./table/columns";
import { useKoudenOfferings } from "@/hooks/useKoudenOfferings";
import type { Offering } from "@/types/offering";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileFilters } from "./card-list/mobile-filters";
import { OfferingCard } from "./card-list/offering-card";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import type { KoudenEntry } from "@/types/kouden";

interface OfferingViewProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	offerings: Offering[];
}

export function OfferingView({
	koudenId,
	koudenEntries,
	offerings,
}: OfferingViewProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("description");
	const [sortOrder, setSortOrder] = useState("created_at_desc");
	const { deleteOffering, updateOffering } = useKoudenOfferings(koudenId);

	const [selectedRows, setSelectedRows] = useState<string[]>([]);

	const handleDeleteSelectedRows = async (ids: string[]) => {
		for (const id of ids) {
			try {
				await deleteOffering(id);
			} catch (error) {
				console.error("Error deleting offering:", id, error);
			}
		}
	};

	// モバイルビューかどうかを判定
	const isMobile = useMediaQuery("(max-width: 767px)");

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...(offerings || [])];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((offering) => {
				const value = offering[searchField as keyof typeof offering];
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
					? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					: new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			}
			if (field === "price") {
				const priceA = a.price || 0;
				const priceB = b.price || 0;
				return order === "desc" ? priceB - priceA : priceA - priceB;
			}
			return 0;
		});

		return result;
	}, [offerings, searchQuery, searchField, sortOrder]);

	const columns = createColumns({
		onEditRow: async (offering: Offering) => {
			const { id, created_at, updated_at, ...rest } = offering;
			const data = Object.fromEntries(
				Object.entries(rest).map(([key, value]) => [
					key,
					value === null ? undefined : value,
				]),
			);
			await updateOffering({ id, data });
		},
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		onCellUpdate: async (id, field, value) => {
			await updateOffering({ id, data: { [field]: value } });
		},
		onCellEdit: async (columnId, rowId, value) => {
			await updateOffering({ id: rowId, data: { [columnId]: value } });
		},
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
							{filteredAndSortedData.map((offering) => (
								<OfferingCard
									key={offering.id}
									offering={offering}
									onDelete={async () => {
										await handleDeleteSelectedRows([offering.id]);
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
					koudenId={koudenId}
					data={filteredAndSortedData}
					koudenEntries={koudenEntries}
				/>
			)}
		</>
	);
}
