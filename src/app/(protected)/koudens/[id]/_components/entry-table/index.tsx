"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { useKoudenEntryTable } from "./use-kouden-entry-table";
import { EntryDialog } from "./entry-dialog";
import type { KoudenEntryTableProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/koudens";

export function KoudenEntryTable(props: KoudenEntryTableProps) {
	const [permission, setPermission] = useState<KoudenPermission>(null);
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

	// 権限チェック
	useEffect(() => {
		const checkPermission = async () => {
			const userPermission = await checkKoudenPermission(props.koudenId);
			setPermission(userPermission);
		};
		checkPermission();
	}, [props.koudenId]);

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

	const columns = createColumns({
		onEditRow: handleEditRow,
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows,
		relationships,
		permission,
	});

	const canEdit = permission === "owner" || permission === "editor";

	return (
		<>
			<DataTable
				columns={columns}
				data={data}
				onAddRow={canEdit ? handleAddRow : undefined}
				onDeleteRows={canEdit ? handleDeleteSelectedRows : undefined}
				koudenId={props.koudenId}
			/>
			{canEdit && (
				<EntryDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					entry={editingEntry}
					onSave={editingEntry ? handleSaveRow : handleAddRow}
					koudenId={props.koudenId}
				/>
			)}
		</>
	);
}
