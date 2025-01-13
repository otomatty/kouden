import { useState, useCallback, useEffect } from "react";
import type { SpreadsheetData, KoudenEntrySpreadsheetProps } from "./types";
import { useRealtimeUpdates } from "./use-realtime-updates";
import { getRelationships } from "@/app/_actions/relationships";

// 郵便番号検索関数
const searchAddress = async (postalCode: string) => {
	if (!postalCode || postalCode.length < 7) return null;

	try {
		const res = await fetch(
			`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
		);
		const data = await res.json();

		if (data.results?.[0]) {
			const { address1, address2, address3 } = data.results[0];
			return `${address1}${address2}${address3}`;
		}
		return null;
	} catch (error) {
		console.error("Failed to search address:", error);
		return null;
	}
};

export function useKoudenEntrySpreadsheet({
	entries: initialEntries,
	koudenId,
	updateKoudenEntry,
	createKoudenEntry,
	deleteKoudenEntries,
}: KoudenEntrySpreadsheetProps) {
	const [data, setData] = useState<SpreadsheetData[]>([]);
	const [relationships, setRelationships] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

	// 初期データの設定
	useEffect(() => {
		if (initialEntries && initialEntries.length > 0) {
			const mappedData: SpreadsheetData[] = initialEntries.map((entry) => ({
				id: entry.id,
				name: entry.name,
				organization: entry.organization || "",
				position: entry.position || "",
				relationship:
					relationships.find((r) => r.id === entry.relationship_id)?.name || "",
				amount: entry.amount,
				postal_code: entry.postal_code || "",
				address: entry.address,
				phone_number: entry.phone_number || "",
				attendance_type:
					entry.attendance_type === "FUNERAL"
						? "葬儀"
						: entry.attendance_type === "CONDOLENCE_VISIT"
							? "弔問"
							: "欠席",
				has_offering: entry.has_offering ? "有" : "無",
				notes: entry.notes || "",
			}));
			setData(mappedData);
		}
	}, [initialEntries, relationships]);

	// 関係性の読み込み
	useEffect(() => {
		async function loadRelationships() {
			try {
				const relations = await getRelationships(koudenId);
				setRelationships(relations);
			} catch (error) {
				console.error("Failed to load relationships:", error);
			}
		}
		loadRelationships();
	}, [koudenId]);

	// リアルタイム更新の設定
	useRealtimeUpdates(koudenId, relationships, setData);

	// セルの値が変更された時の処理
	const handleCellChange = useCallback(
		async (
			entryId: string,
			field: keyof SpreadsheetData,
			value: SpreadsheetData[keyof SpreadsheetData],
		) => {
			const rowData = data.find((row) => row.id === entryId);
			if (!rowData) return;

			const updatedRowData = {
				...rowData,
				[field]: value,
			};

			try {
				// 郵便番号が入力された場合、住所を自動入力
				if (field === "postal_code" && typeof value === "string") {
					const formattedPostalCode = value.replace(/[^\d]/g, "");
					if (formattedPostalCode.length === 7) {
						const address = await searchAddress(formattedPostalCode);
						if (address) {
							updatedRowData.address = address;
						}
					}
				}

				await updateKoudenEntry(entryId, {
					name: updatedRowData.name,
					organization: updatedRowData.organization || undefined,
					position: updatedRowData.position || undefined,
					relationship_id: relationships.find(
						(r) => r.name === updatedRowData.relationship,
					)?.id,
					amount: Number(updatedRowData.amount),
					postal_code: updatedRowData.postal_code || undefined,
					address: updatedRowData.address,
					phone_number: updatedRowData.phone_number || undefined,
					attendance_type:
						updatedRowData.attendance_type === "葬儀"
							? "FUNERAL"
							: updatedRowData.attendance_type === "弔問"
								? "CONDOLENCE_VISIT"
								: null,
					has_offering: updatedRowData.has_offering === "有",
					notes: updatedRowData.notes || undefined,
				});

				setData((prev) =>
					prev.map((row) => (row.id === entryId ? updatedRowData : row)),
				);
			} catch (error) {
				console.error("Failed to update entry:", error);
			}
		},
		[data, relationships, updateKoudenEntry],
	);

	// 行の選択状態が変更された時の処理
	const handleRowSelectionChange = useCallback(
		(id: string, isSelected: boolean) => {
			setSelectedRows((prev) => {
				const next = new Set(prev);
				if (isSelected) {
					next.add(id);
				} else {
					next.delete(id);
				}
				return next;
			});

			setData((prev) =>
				prev.map((row) => (row.id === id ? { ...row, isSelected } : row)),
			);
		},
		[],
	);

	// 選択された行の削除
	const handleDeleteSelectedRows = useCallback(
		async (ids?: string[]) => {
			try {
				const idsToDelete = ids || Array.from(selectedRows);
				if (idsToDelete.length === 0) return;

				await deleteKoudenEntries(idsToDelete);

				// 状態を更新
				setData((prev) => prev.filter((row) => !idsToDelete.includes(row.id)));
				setSelectedRows((prev) => {
					const next = new Set(prev);
					for (const id of idsToDelete) {
						next.delete(id);
					}
					return next;
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
			}
		},
		[selectedRows, deleteKoudenEntries, setData],
	);

	// 新しい行の追加
	const handleAddRow = useCallback(async () => {
		try {
			const newEntry = await createKoudenEntry({
				kouden_id: koudenId,
				name: "",
				amount: 0,
				attendance_type: "FUNERAL",
				has_offering: false,
				postal_code: "",
				address: "",
				is_return_completed: false,
			});

			if (newEntry) {
				const newRow: SpreadsheetData = {
					id: newEntry.id,
					name: newEntry.name,
					organization: "",
					position: "",
					relationship: "",
					amount: newEntry.amount,
					postal_code: "",
					address: newEntry.address,
					phone_number: "",
					attendance_type: "葬儀",
					has_offering: "無",
					notes: "",
					isSelected: false,
				};
				setData((prev) => [...prev, newRow]);
			}
		} catch (error) {
			console.error("Failed to add row:", error);
		}
	}, [koudenId, createKoudenEntry]);

	return {
		data,
		relationships,
		selectedRows,
		handleCellChange,
		handleRowSelectionChange,
		handleDeleteSelectedRows,
		handleAddRow,
	};
}
