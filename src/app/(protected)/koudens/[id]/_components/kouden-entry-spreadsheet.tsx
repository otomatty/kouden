"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HotTable, type HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import type { CellChange, ChangeSource } from "handsontable/common";
import type Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import type { Database } from "@/types/supabase";
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

// すべてのHandsontableモジュールを登録
registerAllModules();

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

const COLUMNS: {
	data: keyof SpreadsheetData;
	title: string;
	type?: "dropdown";
	source?: string[];
	numericFormat?: {
		pattern: string;
		culture: string;
	};
	allowInvalid?: boolean;
	className?: string;
	validator?: (
		value: string | null,
		callback: (isValid: boolean) => void,
	) => void;
}[] = [
	{ data: "name", title: "ご芳名" },
	{ data: "organization", title: "団体名" },
	{ data: "position", title: "役職" },
	{
		data: "relationship",
		title: "ご関係",
		type: "dropdown",
		source: [], // 動的に更新
		allowInvalid: false,
	},
	{
		data: "amount",
		title: "金額",
		type: "dropdown",
		source: Array.from(AMOUNT_OPTIONS).map(String),
		numericFormat: {
			pattern: "¥ 0,0",
			culture: "ja-JP",
		},
		allowInvalid: false,
		className: "htRight htMiddle",
		validator: (value: string | null, callback: (isValid: boolean) => void) => {
			if (value === null || value === "") {
				callback(true);
				return;
			}
			callback(Number.isInteger(Number(value)) && Number(value) >= 0);
		},
	},
	{ data: "postal_code", title: "郵便番号" },
	{ data: "address", title: "住所" },
	{ data: "phone_number", title: "電話番号" },
	{
		data: "attendance_type",
		title: "参列",
		type: "dropdown",
		source: Array.from(ATTENDANCE_OPTIONS),
	},
	{
		data: "has_offering",
		title: "供物",
		type: "dropdown",
		source: Array.from(BOOLEAN_OPTIONS),
	},
	{
		data: "is_return_completed",
		title: "香典返し済",
		type: "dropdown",
		source: Array.from(COMPLETION_OPTIONS),
	},
	{ data: "notes", title: "備考" },
];

// 郵便番号検索関数
async function searchAddress(postalCode: string): Promise<string | null> {
	try {
		const response = await fetch(
			`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
		);
		const data = await response.json();

		if (data.results?.[0]) {
			const { address1, address2, address3 } = data.results[0];
			return `${address1}${address2}${address3}`;
		}
		return null;
	} catch (error) {
		console.error("Failed to fetch address:", error);
		return null;
	}
}

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
	is_return_completed: "済" | "未";
	notes: string;
}

export function KoudenEntrySpreadsheet({
	entries: initialEntries,
	koudenId,
	updateKoudenEntry,
	createKoudenEntry,
}: KoudenEntrySpreadsheetProps) {
	const hotTableRef = useRef<HotTableClass>(null);
	const [data, setData] = useState<SpreadsheetData[]>(
		() =>
			initialEntries?.map((entry) => ({
				id: entry.id,
				name: entry.name,
				organization: entry.organization || "",
				position: entry.position || "",
				relationship: entry.relationship_id || "",
				amount: entry.amount,
				postal_code: entry.postal_code || "",
				address: entry.address,
				phone_number: entry.phone_number || "",
				attendance_type:
					entry.attendance_type === "FUNERAL"
						? "葬儀"
						: entry.attendance_type === "CONDOLENCE_VISIT"
							? "弔問"
							: ("欠席" as const),
				has_offering: entry.has_offering ? "有" : "無",
				is_return_completed: entry.is_return_completed ? "済" : "未",
				notes: entry.notes || "",
			})) || [],
	);
	const [entries, setEntries] = useState(initialEntries);
	const [relationships, setRelationships] = useState<string[]>([]);
	const router = useRouter();

	// 関係性のリストを読み込む
	useEffect(() => {
		async function loadRelationships() {
			try {
				const relations = await getRelationships(koudenId);
				const relationNames = relations.map((r) => r.name);
				setRelationships(relationNames);
				// COLUMNSの関係性のsourceを更新
				const relationshipColumn = COLUMNS.find(
					(col) => col.data === "relationship",
				);
				if (relationshipColumn) {
					relationshipColumn.source = relationNames;
				}
			} catch (error) {
				console.error("Failed to load relationships:", error);
			}
		}
		loadRelationships();
	}, [koudenId]);

	useEffect(() => {
		const supabase = createClient();
		console.log("Setting up subscription for koudenId:", koudenId);

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
					console.log("Received payload:", payload);
					if (payload.eventType === "INSERT") {
						console.log("INSERT event received");
						const { data: newEntry, error } = await supabase
							.from("kouden_entries")
							.select(`
								*,
								offerings:offerings(*),
								return_items:return_items(*)
							`)
							.eq("id", payload.new.id)
							.single();

						console.log("Fetched new entry:", newEntry, "Error:", error);

						if (newEntry) {
							setEntries((prev) => {
								console.log("Previous entries:", prev);
								const updated = [...prev, newEntry as unknown as KoudenEntry];
								console.log("Updated entries:", updated);
								return updated;
							});
							setData((prev) => {
								console.log("Previous data:", prev);
								const updated = [
									...prev,
									{
										id: newEntry.id,
										name: newEntry.name,
										organization: newEntry.organization || "",
										position: newEntry.position || "",
										relationship: newEntry.relationship_id || "",
										amount: newEntry.amount,
										postal_code: newEntry.postal_code || "",
										address: newEntry.address,
										phone_number: newEntry.phone_number || "",
										attendance_type:
											newEntry.attendance_type === "FUNERAL"
												? ("葬儀" as const)
												: newEntry.attendance_type === "CONDOLENCE_VISIT"
													? ("弔問" as const)
													: ("欠席" as const),
										has_offering: newEntry.has_offering ? "有" : "無",
										is_return_completed: newEntry.is_return_completed
											? "済"
											: "未",
										notes: newEntry.notes || "",
									} satisfies SpreadsheetData,
								];
								console.log("Updated data:", updated);
								return updated;
							});
						}
					} else if (payload.eventType === "UPDATE") {
						const { data: updatedEntry } = await supabase
							.from("kouden_entries")
							.select("*, offerings (*), return_items (*)")
							.eq("id", payload.new.id)
							.single();

						if (updatedEntry) {
							setEntries((prev) =>
								prev.map((entry) =>
									entry.id === updatedEntry.id
										? (updatedEntry as unknown as KoudenEntry)
										: entry,
								),
							);
							setData((prev) =>
								prev.map((entry) =>
									entry.id === updatedEntry.id
										? {
												id: updatedEntry.id,
												name: updatedEntry.name,
												organization: updatedEntry.organization || "",
												position: updatedEntry.position || "",
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
															: null,
												has_offering: updatedEntry.has_offering ? "有" : "無",
												is_return_completed: updatedEntry.is_return_completed
													? "済"
													: "未",
												notes: updatedEntry.notes || "",
											}
										: entry,
								),
							);
						}
					} else if (payload.eventType === "DELETE") {
						setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
						setData((prev) =>
							prev.filter((entry) => entry.id !== payload.old.id),
						);
					}
				},
			);

		koudenEntriesSubscription.subscribe((status) => {
			console.log("Subscription status:", status);
		});

		return () => {
			console.log("Cleaning up subscription");
			supabase.channel("kouden_entries_changes").unsubscribe();
		};
	}, [koudenId]);

	const handleAddRow = useCallback(async () => {
		console.log("Adding new row for koudenId:", koudenId);
		try {
			const response = await createKoudenEntry({
				kouden_id: koudenId,
				name: "",
				amount: 0,
				attendance_type: "FUNERAL",
				has_offering: false,
				is_return_completed: false,
				postal_code: "",
				address: "",
			});
			console.log("Created new entry:", response);

			router.refresh();
		} catch (error) {
			console.error("Failed to add row:", error);
		}
	}, [koudenId, createKoudenEntry, router]);

	const handleChange = useCallback(
		async (changes: CellChange[] | null, source: ChangeSource) => {
			if (!changes) return;

			for (const [row, prop, oldValue, newValue] of changes) {
				const entryId = data[row].id;
				if (!entryId) continue;

				// 関係性が新しく追加された場合
				if (
					prop === "relationship" &&
					newValue &&
					!relationships.includes(newValue)
				) {
					try {
						await createRelationship({
							koudenId,
							name: newValue,
							description: `${newValue}として追加`,
						});
						setRelationships((prev) => [...prev, newValue]);
					} catch (error) {
						console.error("Failed to create relationship:", error);
						// エラー時は古い値に戻す
						const hot = hotTableRef.current?.hotInstance;
						if (hot) {
							hot.setDataAtCell(row, hot.propToCol(prop), oldValue);
						}
						return;
					}
				}

				// データの更新
				const rowData = data[row];
				try {
					await updateKoudenEntry(entryId, {
						name: rowData.name,
						organization: rowData.organization || undefined,
						position: rowData.position || undefined,
						relationship_id: rowData.relationship || undefined,
						amount: Number(rowData.amount),
						postal_code: rowData.postal_code || undefined,
						address: rowData.address,
						phone_number: rowData.phone_number || undefined,
						attendance_type:
							rowData.attendance_type === "葬儀"
								? "FUNERAL"
								: rowData.attendance_type === "弔問"
									? "CONDOLENCE_VISIT"
									: null,
						has_offering: rowData.has_offering === "有",
						is_return_completed: rowData.is_return_completed === "済",
						notes: rowData.notes || undefined,
					});
				} catch (error) {
					console.error("Failed to update entry:", error);
					// エラー時は古い値に戻す
					const hot = hotTableRef.current?.hotInstance;
					if (hot) {
						hot.setDataAtCell(row, hot.propToCol(prop), oldValue);
					}
				}
			}
		},
		[data, koudenId, relationships, updateKoudenEntry],
	);

	return (
		<div className="space-y-4">
			<div className="overflow-auto">
				<div className="min-w-[1200px]">
					<HotTable
						ref={hotTableRef}
						data={data}
						colHeaders={COLUMNS.map((col) => col.title)}
						columns={COLUMNS}
						rowHeaders={true}
						width="100%"
						height="auto"
						licenseKey="non-commercial-and-evaluation"
						afterChange={handleChange}
						stretchH="all"
						className="htMiddle"
						beforeKeyDown={(event) => {
							// Ctrl+Enter または Cmd+Enter で行を追加
							if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
								event.stopImmediatePropagation();
								handleAddRow();
							}
						}}
					/>
				</div>
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
