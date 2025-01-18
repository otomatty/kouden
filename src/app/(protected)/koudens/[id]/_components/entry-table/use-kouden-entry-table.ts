import { useState, useCallback } from "react";
import type {
	KoudenEntryTableData,
	KoudenEntryTableProps,
	EditKoudenEntryFormData,
} from "./types";

export function useKoudenEntryTable({
	entries: initialEntries,
	koudenId,
	updateKoudenEntry,
	createKoudenEntry,
	deleteKoudenEntries,
}: KoudenEntryTableProps) {
	const [data, setData] = useState<KoudenEntryTableData[]>(initialEntries);
	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [editingEntry, setEditingEntry] = useState<
		KoudenEntryTableData | undefined
	>();
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// ダイアログの開閉を制御
	const handleDialogOpenChange = useCallback((open: boolean) => {
		setIsDialogOpen(open);
		if (!open) {
			setEditingEntry(undefined);
		}
	}, []);

	// 行の編集を開始
	const handleEditRow = useCallback(
		(id: string) => {
			const entry = data.find((entry) => entry.id === id);
			if (entry) {
				setEditingEntry(entry);
				setIsDialogOpen(true);
			}
		},
		[data],
	);

	// 編集をキャンセル
	const handleCancelEdit = useCallback(() => {
		setEditingEntry(undefined);
		setIsDialogOpen(false);
	}, []);

	// 編集を保存
	const handleSaveRow = useCallback(
		async (formData: EditKoudenEntryFormData) => {
			if (editingEntry) {
				try {
					const response = await updateKoudenEntry(editingEntry.id, formData);
					setData((prev) =>
						prev.map((row) => (row.id === editingEntry.id ? response : row)),
					);
					handleCancelEdit();
				} catch (error) {
					console.error("Failed to save row:", error);
				}
			}
		},
		[editingEntry, updateKoudenEntry, handleCancelEdit],
	);

	// 新しい行を追加
	const handleAddRow = useCallback(
		async (formData: EditKoudenEntryFormData) => {
			try {
				const response = await createKoudenEntry({
					...formData,
					kouden_id: koudenId,
					name: formData.name ?? null,
					address: formData.address ?? null,
				});
				setData((prev) => [...prev, response]);
				setIsDialogOpen(false);
			} catch (error) {
				console.error("Failed to add row:", error);
			}
		},
		[koudenId, createKoudenEntry],
	);

	// 選択された行を削除
	const handleDeleteSelectedRows = useCallback(
		async (ids: string[]) => {
			try {
				await deleteKoudenEntries(ids);
				setData((prev) => prev.filter((row) => !ids.includes(row.id)));
				setSelectedRows((prev) => {
					const next = new Set(prev);
					for (const id of ids) {
						next.delete(id);
					}
					return next;
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
			}
		},
		[deleteKoudenEntries],
	);

	return {
		data,
		selectedRows,
		editingEntry,
		isDialogOpen,
		setIsDialogOpen: handleDialogOpenChange,
		handleEditRow,
		handleCancelEdit,
		handleSaveRow,
		handleAddRow,
		handleDeleteSelectedRows,
	};
}
