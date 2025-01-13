"use client";

import { useEffect } from "react";
import { DataTable } from "./data-table/data-table";
import { createColumns } from "./data-table/columns";
import { useKoudenEntryTable } from "./data-table/use-kouden-entry-table";
import { EntryDialog } from "./data-table/entry-dialog";
import type { KoudenEntryTableProps } from "./data-table/types";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";

export function KoudenEntryTable(props: KoudenEntryTableProps) {
	const {
		data,
		selectedRows,
		editingEntry,
		isDialogOpen,
		setIsDialogOpen,
		handleEditRow,
		handleCancelEdit,
		handleSaveRow,
		handleAddRow,
		handleDeleteSelectedRows,
	} = useKoudenEntryTable(props);

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
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				setIsDialogOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [setIsDialogOpen]);

	const columns = createColumns({
		onEditRow: handleEditRow,
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		relationships,
	});

	return (
		<>
			<DataTable
				columns={columns}
				data={data}
				onAddRow={handleAddRow}
				onDeleteRows={handleDeleteSelectedRows}
				koudenId={props.koudenId}
			/>
			<EntryDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				entry={editingEntry}
				onSave={editingEntry ? handleSaveRow : handleAddRow}
				koudenId={props.koudenId}
			/>
		</>
	);
}
