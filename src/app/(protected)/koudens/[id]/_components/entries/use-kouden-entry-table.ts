import { useState, useCallback, useEffect } from "react";
import type { KoudenEntryTableData, EditKoudenEntryFormData } from "./types";
import { toast } from "@/hooks/use-toast";
import { useKoudenEntries } from "@/hooks/useKoudenEntries";

interface UseKoudenEntryTableProps {
	entries: KoudenEntryTableData[];
	koudenId: string;
}

export function useKoudenEntryTable({
	entries,
	koudenId,
}: UseKoudenEntryTableProps) {
	const [data, setData] = useState<KoudenEntryTableData[]>(entries || []);
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [editingEntry, setEditingEntry] = useState<KoudenEntryTableData | null>(
		null,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const { updateEntry, deleteEntry, error } = useKoudenEntries(koudenId);

	// データの更新を監視
	useEffect(() => {
		setData(entries || []);
	}, [entries]);

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

	// セルの更新
	const handleCellUpdate = useCallback(
		async (
			id: string,
			field: keyof KoudenEntryTableData,
			value: KoudenEntryTableData[keyof KoudenEntryTableData],
		) => {
			try {
				const currentEntry = data.find((entry) => entry.id === id);
				if (!currentEntry) {
					console.error("Entry not found:", id);
					return;
				}

				const {
					created_at,
					updated_at,
					created_by,
					version,
					last_modified_at,
					last_modified_by,
					...updateData
				} = currentEntry;

				const response = await updateEntry({
					id,
					data: {
						...updateData,
						[field]: value,
						kouden_id: koudenId,
						attendance_type: updateData.attendance_type || "ABSENT",
					},
				});

				setData((prevData) =>
					prevData.map((entry) =>
						entry.id === id
							? {
									...entry,
									...response,
								}
							: entry,
					),
				);
			} catch (error) {
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[data, koudenId, updateEntry],
	);

	// 編集を保存
	const handleSaveRow = useCallback(
		async (formData: EditKoudenEntryFormData, entryId?: string) => {
			const targetId = entryId || editingEntry?.id;
			if (!targetId) {
				throw new Error("No entry ID provided for update");
			}

			try {
				const response = await updateEntry({
					id: targetId,
					data: formData,
				});
				if (!response) throw new Error("Failed to update entry");
				setData((prev) =>
					prev.map((row) => (row.id === targetId ? response : row)),
				);
				handleCancelEdit();
				return response;
			} catch (error) {
				console.error("Failed to save row:", error);
				throw error;
			}
		},
		[editingEntry, updateEntry, handleCancelEdit],
	);

	// 選択された行を削除
	const handleDeleteSelectedRows = useCallback(
		async (ids: string[]) => {
			try {
				// 各IDに対して削除を実行
				await Promise.all(ids.map((id) => deleteEntry(id)));

				// データと選択状態を更新
				setData((prev) => prev.filter((row) => !ids.includes(row.id)));
				setSelectedRows((prev) => prev.filter((id) => !ids.includes(id)));

				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
				throw error;
			}
		},
		[deleteEntry],
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
		handleDeleteSelectedRows,
		handleCellUpdate,
		setData,
		error,
	};
}
