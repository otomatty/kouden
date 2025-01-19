import { useState, useCallback, useEffect } from "react";
import type {
	KoudenEntryTableData,
	KoudenEntryTableProps,
	EditKoudenEntryFormData,
} from "./types";

export function useKoudenEntryTable(props: KoudenEntryTableProps) {
	const [data, setData] = useState<KoudenEntryTableData[]>(props.entries || []);
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [editingEntry, setEditingEntry] = useState<KoudenEntryTableData | null>(
		null,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// データの更新を監視
	useEffect(() => {
		setData(props.entries || []);
	}, [props.entries]);

	// ダイアログの開閉を制御
	const handleDialogOpenChange = useCallback((open: boolean) => {
		setIsDialogOpen(open);
		if (!open) {
			setEditingEntry(null);
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
		setEditingEntry(null);
		setIsDialogOpen(false);
	}, []);

	// 編集を保存
	const handleSaveRow = useCallback(
		async (formData: EditKoudenEntryFormData, entryId?: string) => {
			const targetId = entryId || editingEntry?.id;
			if (!targetId) {
				throw new Error("No entry ID provided for update");
			}

			try {
				console.log("handleSaveRow: Updating entry", {
					id: targetId,
					formData,
				});
				const response = await props.updateKoudenEntry(targetId, formData);
				console.log("handleSaveRow: Update successful", response);
				setData((prev) => {
					const newData = prev.map((row) =>
						row.id === targetId ? response : row,
					);
					console.log("handleSaveRow: Updated data", newData);
					return newData;
				});
				handleCancelEdit();
				return response;
			} catch (error) {
				console.error("Failed to save row:", error);
				throw error;
			}
		},
		[editingEntry, props.updateKoudenEntry, handleCancelEdit],
	);

	// 新しい行を追加
	const handleAddRow = async (formData: EditKoudenEntryFormData) => {
		try {
			const newEntry = await props.createKoudenEntry({
				...formData,
				kouden_id: props.koudenId,
				name: formData.name ?? null,
				address: formData.address ?? null,
			});

			// 新しいエントリーをデータの先頭に追加
			setData((prevData) => [newEntry, ...prevData]);

			return newEntry;
		} catch (error) {
			console.error("Failed to add entry:", error);
			throw error;
		}
	};

	// 選択された行を削除
	const handleDeleteSelectedRows = useCallback(
		async (ids: string[]) => {
			try {
				await props.deleteKoudenEntries(ids);
				setData((prev) => prev.filter((row) => !ids.includes(row.id)));
				setSelectedRows((prev) => {
					const next = prev.filter((id) => !ids.includes(id));
					return next;
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
			}
		},
		[props.deleteKoudenEntries],
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
		setData,
	};
}
