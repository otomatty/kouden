"use client";

import { useState, useCallback, useEffect } from "react";
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	createColumnHelper,
} from "@tanstack/react-table";
import type {
	UpdateKoudenEntryInput,
	KoudenEntryResponse,
	CreateKoudenEntryInput,
} from "@/types/actions";
import type { KoudenEntry } from "@/types/kouden";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
	createRelationship,
	getRelationships,
} from "@/app/_actions/relationships";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface KoudenEntrySpreadsheetProps {
	entries: KoudenEntry[];
	koudenId: string;
	updateKoudenEntry: (
		id: string,
		input: UpdateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
	createKoudenEntry: (
		input: CreateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
}

const ATTENDANCE_OPTIONS = ["葬儀", "弔問", "欠席"] as const;
const BOOLEAN_OPTIONS = ["有", "無"] as const;
const COMPLETION_OPTIONS = ["済", "未"] as const;
const AMOUNT_OPTIONS = [
	1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 100000,
] as const;

interface SpreadsheetData {
	id: string;
	name: string;
	organization: string;
	position: string;
	relationship?: string;
	amount: number;
	postal_code: string;
	address: string;
	phone_number: string;
	attendance_type: "葬儀" | "弔問" | "欠席" | null;
	has_offering: "有" | "無";
	notes: string;
}

export function KoudenEntrySpreadsheet({
	entries: initialEntries,
	koudenId,
	updateKoudenEntry,
	createKoudenEntry,
}: KoudenEntrySpreadsheetProps) {
	const [data, setData] = useState<SpreadsheetData[]>([]);
	const [relationships, setRelationships] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const router = useRouter();
	const columnHelper = createColumnHelper<SpreadsheetData>();

	// 関係性のリストを読み込む
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

	// データの初期化を関係性の読み込み後に行う
	useEffect(() => {
		if (relationships.length > 0 && initialEntries) {
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
	}, [relationships, initialEntries]);

	// Supabaseのリアルタイム購読を設定
	useEffect(() => {
		const supabase = createClient();

		const koudenEntriesSubscription = supabase
			.channel("kouden_entries_changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "kouden_entries",
					filter: `kouden_id=eq.${koudenId}`,
				},
				async (payload) => {
					if (payload.eventType === "INSERT") {
						const { data: newEntry } = await supabase
							.from("kouden_entries")
							.select("*")
							.eq("id", payload.new.id)
							.single();

						if (newEntry && relationships.length > 0) {
							setData((prev) => [
								...prev,
								{
									id: newEntry.id,
									name: newEntry.name,
									organization: newEntry.organization || "",
									position: newEntry.position || "",
									relationship:
										relationships.find((r) => r.id === newEntry.relationship_id)
											?.name || "",
									amount: newEntry.amount,
									postal_code: newEntry.postal_code || "",
									address: newEntry.address,
									phone_number: newEntry.phone_number || "",
									attendance_type:
										newEntry.attendance_type === "FUNERAL"
											? "葬儀"
											: newEntry.attendance_type === "CONDOLENCE_VISIT"
												? "弔問"
												: "欠席",
									has_offering: newEntry.has_offering ? "有" : "無",
									notes: newEntry.notes || "",
								},
							]);
						}
					} else if (payload.eventType === "UPDATE") {
						const { data: updatedEntry } = await supabase
							.from("kouden_entries")
							.select("*")
							.eq("id", payload.new.id)
							.single();

						if (updatedEntry && relationships.length > 0) {
							setData((prev) =>
								prev.map((entry) =>
									entry.id === updatedEntry.id
										? {
												id: updatedEntry.id,
												name: updatedEntry.name,
												organization: updatedEntry.organization || "",
												position: updatedEntry.position || "",
												relationship:
													relationships.find(
														(r) => r.id === updatedEntry.relationship_id,
													)?.name || "",
												amount: updatedEntry.amount,
												postal_code: updatedEntry.postal_code || "",
												address: updatedEntry.address,
												phone_number: updatedEntry.phone_number || "",
												attendance_type:
													updatedEntry.attendance_type === "FUNERAL"
														? "葬儀"
														: updatedEntry.attendance_type ===
																"CONDOLENCE_VISIT"
															? "弔問"
															: "欠席",
												has_offering: updatedEntry.has_offering ? "有" : "無",
												notes: updatedEntry.notes || "",
											}
										: entry,
								),
							);
						}
					} else if (payload.eventType === "DELETE") {
						setData((prev) => prev.filter((e) => e.id !== payload.old.id));
					}
				},
			);

		koudenEntriesSubscription.subscribe();

		return () => {
			supabase.channel("kouden_entries_changes").unsubscribe();
		};
	}, [koudenId, relationships]);

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

	// セルコンポーネント
	const createCellComponent = (
		key: keyof SpreadsheetData,
		type: "text" | "number" | "select",
		options?: { value: string; label: string }[],
	) => {
		return ({
			getValue,
			row,
		}: {
			getValue: () => SpreadsheetData[typeof key];
			row: { original: SpreadsheetData };
		}) => {
			const value = getValue();
			const [localValue, setLocalValue] = useState(value);

			const handleBlur = async () => {
				if (localValue === value) return;

				// 郵便番号が入力された場合、住所を自動入力
				if (key === "postal_code" && typeof localValue === "string") {
					const formattedPostalCode = localValue.replace(/[^\d]/g, "");
					if (formattedPostalCode.length === 7) {
						const address = await searchAddress(formattedPostalCode);
						if (address) {
							// 郵便番号と住所を同時に更新
							const rowData = data.find((r) => r.id === row.original.id);
							if (rowData) {
								try {
									await updateKoudenEntry(row.original.id, {
										name: rowData.name,
										organization: rowData.organization || undefined,
										position: rowData.position || undefined,
										relationship_id: relationships.find(
											(r) => r.name === rowData.relationship,
										)?.id,
										amount: Number(rowData.amount),
										postal_code: formattedPostalCode,
										address: address,
										phone_number: rowData.phone_number || undefined,
										attendance_type:
											rowData.attendance_type === "葬儀"
												? "FUNERAL"
												: rowData.attendance_type === "弔問"
													? "CONDOLENCE_VISIT"
													: null,
										has_offering: rowData.has_offering === "有",
										notes: rowData.notes || undefined,
									});

									// 更新が成功したら、ローカルの状態を更新
									setData((prev) =>
										prev.map((r) =>
											r.id === row.original.id
												? {
														...r,
														postal_code: formattedPostalCode,
														address: address,
													}
												: r,
										),
									);
									return; // 郵便番号と住所を更新したので、以降の処理は不要
								} catch (error) {
									console.error(
										"Failed to update postal code and address:",
										error,
									);
								}
							}
						}
					}
				}

				handleCellChange(row.original.id, key, localValue);
			};

			if (type === "select" && options) {
				return (
					<Select
						value={String(localValue || options[0].value)}
						onValueChange={(newValue: string) => {
							setLocalValue(newValue);
						}}
						onOpenChange={(open) => {
							if (!open) handleBlur();
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			}

			return (
				<Input
					type={type}
					value={localValue?.toString() || ""}
					min={type === "number" ? 0 : undefined}
					step={type === "number" ? 1000 : undefined}
					onChange={(e) => {
						const newValue =
							type === "number" ? Number(e.target.value) : e.target.value;
						setLocalValue(newValue);
					}}
					onBlur={handleBlur}
					className={`w-full ${type === "number" ? "text-right" : ""}`}
				/>
			);
		};
	};

	// カラム定義を修正
	const columns = [
		columnHelper.accessor("name", {
			header: "ご芳名",
			cell: createCellComponent("name", "text"),
		}),
		columnHelper.accessor("organization", {
			header: "団体名",
			cell: createCellComponent("organization", "text"),
		}),
		columnHelper.accessor("position", {
			header: "役職",
			cell: createCellComponent("position", "text"),
		}),
		columnHelper.accessor("relationship", {
			header: "ご関係",
			cell: createCellComponent(
				"relationship",
				"select",
				relationships.map((rel) => ({
					value: rel.name,
					label: rel.name,
				})),
			),
		}),
		columnHelper.accessor("amount", {
			header: "金額",
			cell: createCellComponent("amount", "number"),
		}),
		columnHelper.accessor("postal_code", {
			header: "郵便番号",
			cell: createCellComponent("postal_code", "text"),
		}),
		columnHelper.accessor("address", {
			header: "住所",
			cell: createCellComponent("address", "text"),
		}),
		columnHelper.accessor("phone_number", {
			header: "電話番号",
			cell: createCellComponent("phone_number", "text"),
		}),
		columnHelper.accessor("attendance_type", {
			header: "参列",
			cell: createCellComponent(
				"attendance_type",
				"select",
				ATTENDANCE_OPTIONS.map((option) => ({
					value: option,
					label: option,
				})),
			),
		}),
		columnHelper.accessor("has_offering", {
			header: "供物",
			cell: createCellComponent(
				"has_offering",
				"select",
				BOOLEAN_OPTIONS.map((option) => ({
					value: option,
					label: option,
				})),
			),
		}),
		columnHelper.accessor("notes", {
			header: "備考",
			cell: createCellComponent("notes", "text"),
		}),
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

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

				// 更新が成功したら、ローカルの状態を更新
				setData((prev) =>
					prev.map((row) => (row.id === entryId ? updatedRowData : row)),
				);
			} catch (error) {
				console.error("Failed to update entry:", error);
			}
		},
		[data, relationships, updateKoudenEntry],
	);

	const handleAddRow = useCallback(async () => {
		try {
			await createKoudenEntry({
				kouden_id: koudenId,
				name: "",
				amount: 0,
				attendance_type: "FUNERAL",
				has_offering: false,
				postal_code: "",
				address: "",
				is_return_completed: false,
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to add row:", error);
		}
	}, [koudenId, createKoudenEntry, router]);

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="border border-gray-200 bg-gray-50 p-2 text-left text-sm font-medium text-gray-500"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="border border-gray-200 p-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex justify-center">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleAddRow}
					className="flex items-center gap-2"
				>
					<PlusCircle className="h-4 w-4" />
					<span>行を追加 (Ctrl+Enter)</span>
				</Button>
			</div>
		</div>
	);
}
