"use client";

import { useEffect, useState, useMemo } from "react";
import { DataTable } from "./table/data-table";
import { createColumns } from "./table/columns";
import { useKoudenEntryTable } from "./use-kouden-entry-table";
import type { EditKoudenEntryFormData, KoudenEntryTableData } from "./types";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/koudens";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EntryCard } from "./card-list/entry-card";
import { MobileFilters } from "./card-list/mobile-filters";
import { EntryDialog } from "./dialog/entry-dialog";

interface KoudenEntryTableProps {
	entries: KoudenEntryTableData[];
	koudenId: string;
}

export function KoudenEntryTable({ entries, koudenId }: KoudenEntryTableProps) {
	const [permission, setPermission] = useState<KoudenPermission>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");
	const [editingEntry, setEditingEntry] = useState<
		KoudenEntryTableData | undefined
	>(undefined);
	const [editingDialogOpen, setEditingDialogOpen] = useState(false);
	const {
		data,
		selectedRows,
		setIsDialogOpen,
		handleSaveRow,
		handleDeleteSelectedRows,
		setData,
	} = useKoudenEntryTable({ entries, koudenId });

	// モバイルビューかどうかを判定（768px未満をモバイルとする）
	const isMobile = useMediaQuery("(max-width: 767px)");

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		let result = [...data];

		// 検索を適用
		if (searchQuery) {
			result = result.filter((entry) => {
				const value = entry[searchField as keyof typeof entry];
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
	}, [data, searchQuery, searchField, sortOrder]);

	// 権限チェック
	useEffect(() => {
		const checkPermission = async () => {
			const userPermission = await checkKoudenPermission(koudenId);
			setPermission(userPermission);
		};
		checkPermission();
	}, [koudenId]);

	// 関係性データの取得
	const { data: relationships = [] } = useQuery({
		queryKey: ["relationships", koudenId],
		queryFn: async () => {
			const data = await getRelationships(koudenId);
			return data.map((rel) => ({
				id: rel.id,
				name: rel.name,
				description: rel.description || undefined,
			}));
		},
	});

	// キーボードショートカットの設定
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				(e.ctrlKey || e.metaKey) &&
				e.key === "Enter" &&
				(permission === "owner" || permission === "editor")
			) {
				e.preventDefault();
				setIsDialogOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [setIsDialogOpen, permission]);

	// エントリーの更新処理をラップ
	const handleEntryUpdate = async (
		formData: EditKoudenEntryFormData,
		entryId: string,
	) => {
		const updatedEntry = await handleSaveRow(formData, entryId);
		if (updatedEntry) {
			setData((prevData: KoudenEntryTableData[]) =>
				prevData.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
			);
			return updatedEntry;
		}
		const originalEntry = data.find((entry) => entry.id === entryId);
		if (!originalEntry) throw new Error("Entry not found");
		return originalEntry;
	};

	const columns = createColumns({
		onEditRow: (entry: KoudenEntryTableData) => {
			setEditingEntry(entry);
			setEditingDialogOpen(true);
		},
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		relationships,
		permission,
		koudenId,
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
					/>
					<div className="flex-1 overflow-auto">
						<div className="space-y-2 py-4">
							{filteredAndSortedData.map((entry) => (
								<EntryCard
									key={entry.id}
									entry={entry}
									koudenId={koudenId}
									onEdit={handleEntryUpdate}
									onDelete={async (id) => {
										await handleDeleteSelectedRows([id]);
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
				<DataTable columns={columns} koudenId={koudenId} />
			)}

			<EntryDialog
				koudenId={koudenId}
				defaultValues={editingEntry}
				onSuccess={(updatedEntry) => {
					setData((prevData: KoudenEntryTableData[]) =>
						prevData.map((entry) =>
							entry.id === updatedEntry.id ? updatedEntry : entry,
						),
					);
					setEditingEntry(undefined);
				}}
			/>
		</>
	);
}
