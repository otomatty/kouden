"use client";

import { useEffect, useState, useMemo } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { useKoudenEntryTable } from "./use-kouden-entry-table";
import { EntryDialog } from "./entry-dialog";
import type { KoudenEntryTableProps, EditKoudenEntryFormData } from "./types";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/koudens";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EntryCard } from "./entry-card";
import { MobileFilters } from "./mobile-filters";

export function KoudenEntryTable(props: KoudenEntryTableProps) {
	const [permission, setPermission] = useState<KoudenPermission>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchField, setSearchField] = useState("name");
	const [sortOrder, setSortOrder] = useState("created_at_desc");
	const {
		data,
		selectedRows,
		editingEntry,
		isDialogOpen,
		setIsDialogOpen,
		handleEditRow,
		handleSaveRow,
		handleAddRow,
		handleDeleteSelectedRows,
		setData,
	} = useKoudenEntryTable(props);

	// データの変更を監視
	useEffect(() => {
		console.log("KoudenEntryTable: Data state updated", {
			dataLength: data.length,
			firstItem: data[0],
			lastItem: data[data.length - 1],
		});
	}, [data]);

	// モバイルビューかどうかを判定（768px未満をモバイルとする）
	const isMobile = useMediaQuery("(max-width: 767px)");
	// タブレットビューかどうかを判定（768px以上1024px未満をタブレットとする）
	const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

	// フィルタリングとソートを適用したデータ
	const filteredAndSortedData = useMemo(() => {
		console.log("KoudenEntryTable: Recalculating filtered and sorted data", {
			dataLength: data.length,
			searchQuery,
			searchField,
			sortOrder,
		});
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
				return (a.name || "").localeCompare(b.name || "");
			}
			return 0;
		});

		console.log("KoudenEntryTable: Filtered and sorted result", {
			resultLength: result.length,
			firstItem: result[0],
			lastItem: result[result.length - 1],
		});

		return result;
	}, [data, searchQuery, searchField, sortOrder]);

	// フィルタリングとソートの変更を監視
	useEffect(() => {
		console.log("KoudenEntryTable: Filtered and sorted data updated", {
			searchQuery,
			searchField,
			sortOrder,
			dataLength: filteredAndSortedData.length,
		});
	}, [filteredAndSortedData, searchQuery, searchField, sortOrder]);

	// 権限チェック
	useEffect(() => {
		const checkPermission = async () => {
			const userPermission = await checkKoudenPermission(props.koudenId);
			setPermission(userPermission);
		};
		checkPermission();
	}, [props.koudenId]);

	// 権限の変更を監視
	useEffect(() => {
		console.log("KoudenEntryTable: Permission changed", permission);
	}, [permission]);

	// 編集中のエントリーの変更を監視
	useEffect(() => {
		console.log("KoudenEntryTable: Editing entry changed", editingEntry);
	}, [editingEntry]);

	// 関係性データの取得
	const { data: relationships = [] } = useQuery({
		queryKey: ["relationships", props.koudenId],
		queryFn: async () => {
			const data = await getRelationships(props.koudenId);
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

	// ダイアログの状態変更を監視
	useEffect(() => {
		console.log("KoudenEntryTable: Dialog state changed", isDialogOpen);
	}, [isDialogOpen]);

	const columns = createColumns({
		onEditRow: handleEditRow,
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		relationships,
		permission,
	});

	const canEdit = permission === "owner" || permission === "editor";

	// エントリーの更新処理をラップ
	const handleEntryUpdate = async (
		formData: EditKoudenEntryFormData,
		entryId: string,
	) => {
		const updatedEntry = await handleSaveRow(formData, entryId);
		// データを即座に更新
		setData((prevData) =>
			prevData.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
		);
		return updatedEntry;
	};

	return (
		<>
			{isMobile ? (
				<div className="flex flex-col h-[100vh]">
					<MobileFilters
						searchQuery={searchQuery}
						onSearchChange={(value) => {
							console.log("KoudenEntryTable: Search query changed", value);
							setSearchQuery(value);
						}}
						searchField={searchField}
						onSearchFieldChange={(value) => {
							console.log("KoudenEntryTable: Search field changed", value);
							setSearchField(value);
						}}
						sortOrder={sortOrder}
						onSortOrderChange={(value) => {
							console.log("KoudenEntryTable: Sort order changed", value);
							setSortOrder(value);
						}}
					/>
					<div className="flex-1 overflow-auto">
						<div className="space-y-2 py-4">
							{filteredAndSortedData.map((entry) => (
								<EntryCard
									key={entry.id}
									entry={entry}
									koudenId={props.koudenId}
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
				<>
					<DataTable
						columns={columns}
						data={data}
						onAddRow={canEdit ? handleAddRow : undefined}
						onDeleteRows={canEdit ? handleDeleteSelectedRows : undefined}
						koudenId={props.koudenId}
					/>
					<EntryDialog
						open={isDialogOpen}
						onOpenChange={setIsDialogOpen}
						onSave={handleSaveRow}
						koudenId={props.koudenId}
						defaultValues={editingEntry || undefined}
					/>
				</>
			)}
		</>
	);
}
