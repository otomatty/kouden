import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { deleteEntries } from "@/app/_actions/entries";
import type { Entry } from "@/types/entries";
import type { NormalizedEntry } from "../normalize-entries";

interface UseBulkDeleteEntriesOptions {
	koudenId: string;
	normalizedEntries: NormalizedEntry[];
	onDataChange?: (entries: Entry[]) => void;
	setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
	rowSelection: Record<string, boolean>;
}

export function useBulkDeleteEntries({
	koudenId,
	normalizedEntries,
	onDataChange,
	setRowSelection,
	rowSelection,
}: UseBulkDeleteEntriesOptions) {
	const selectedRowsIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

	const handleDeleteRows = useCallback(
		async (ids: string[]) => {
			try {
				const result = await deleteEntries(ids, koudenId);
				if (!result.ok) {
					toast.error("削除処理に失敗しました", {
						description: result.error.message,
					});
					return;
				}
				setRowSelection({});
				if (onDataChange) {
					onDataChange(normalizedEntries.filter((entry) => !ids.includes(entry.id)));
				}
				toast.success(`${ids.length}件のデータを削除しました`, {
					description: "削除処理が正常に完了しました",
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
				toast.error("削除処理に失敗しました", {
					description: "しばらく時間をおいてから再度お試しください",
				});
			}
		},
		[koudenId, normalizedEntries, onDataChange, setRowSelection],
	);

	return {
		selectedRowsIds,
		handleDeleteRows,
	};
}
