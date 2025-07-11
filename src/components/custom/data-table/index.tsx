import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
	type Cell,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { EditableCell } from "./editable-cell";
import { SelectCell } from "./select-cell";
import { ColoredSelectCell } from "./colored-select-cell";
import { DateCell } from "./date-cell";
import { AdditionalSelectCell } from "./additional-select-cell";
import { SearchableSelectorDialog } from "@/components/custom/searchable-selector-dialog";
import { Button } from "@/components/ui/button";
import type { CellValue, DataTableProperties } from "@/types/data-table/table";
import type { SelectOption } from "@/types/data-table/additional-select";
import type { OfferingType } from "@/types/offerings";
import { typeLabels } from "@/app/(protected)/koudens/[id]/offerings/_components/table/constants";
import {
	returnStatusMap,
	returnStatusBadgeVariant,
	returnStatusCustomColors,
} from "@/components/ui/status-badge";

/**
 * カスタマイズ可能なデータテーブルコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - ソート機能
 * - フィルタリング機能
 * - カラムの表示/非表示制御
 * - 行の選択機能
 * - セルの編集機能（権限に基づく）
 *
 * 編集可能なセルタイプ：
 * - テキスト入力
 * - 数値入力（フォーマット指定可能）
 * - セレクトボックス
 * - 項目追加型セレクトボックス
 * - 郵便番号入力
 * - 検索可能なチェックボックス
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   editableColumns={{
 *     name: { type: "text" },
 *     age: { type: "number" },
 *     status: { type: "select", options: ["active", "inactive"] }
 *   }}
 *   onCellEdit={(columnId, rowId, newValue) => {
 *     // セルの編集処理
 *   }}
 *   permission="editor"
 * />
 * ```
 *
 * @param {DataTableProperties<Data, CellValue>} props - テーブルのプロパティ
 * @returns {JSX.Element} データテーブルコンポーネント
 */
export function DataTable<Data>({
	columns,
	data,
	editableColumns = {},
	onCellEdit,
	sorting = [],
	onSortingChange,
	columnFilters = [],
	onColumnFiltersChange,
	columnVisibility = {},
	onColumnVisibilityChange,
	rowSelection = {},
	onRowSelectionChange,
	emptyMessage = "データがありません",
	headerClassName,
	bodyClassName,
	cellClassName,
	permission,
}: DataTableProperties<Data, CellValue>) {
	/**
	 * @tanstack/react-tableを使用してテーブルの状態と機能を管理
	 * - ソート状態
	 * - フィルター状態
	 * - カラムの表示/非表示状態
	 * - 行の選択状態
	 */
	const table = useReactTable({
		data,
		// Use stable row IDs to prevent key reordering on deletion
		getRowId: (row: Data) => (row as { id: string }).id,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: onSortingChange,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: onColumnFiltersChange,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: onColumnVisibilityChange,
		onRowSelectionChange: onRowSelectionChange,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	/**
	 * セルのレンダリングロジック
	 * @param cell - テーブルのセル情報
	 * @param columnId - カラムのID
	 * @returns 編集可能なセルまたは通常のセルコンポーネント
	 */
	const renderCell = React.useCallback(
		(cell: Cell<Data, unknown>, columnId: string) => {
			const config = editableColumns[columnId];
			// 権限チェック: owner または editor の場合のみ編集可能
			const canEdit = permission === "owner" || permission === "editor";

			// 編集不可の場合は通常のセルを表示
			if (!config || config.type === "readonly" || !canEdit) {
				return flexRender(cell.column.columnDef.cell, cell.getContext());
			}

			const value = cell.getValue() as CellValue;
			// 返礼記録の場合はkoudenEntryIdを使用、その他はidを使用
			const rowData = cell.row.original as Record<string, unknown>;
			const rowId = (rowData.koudenEntryId as string) || (rowData.id as string);

			/**
			 * セル編集時のコールバック
			 * 親コンポーネントで定義された onCellEdit を呼び出す
			 */
			const handleSave = async (newValue: CellValue) => {
				if (onCellEdit) {
					await onCellEdit(columnId, rowId, newValue);
				}
			};

			// セルタイプに応じて適切な編集コンポーネントを返す
			switch (config.type) {
				case "select":
				case "boolean":
					// 返礼状況の場合は色付きセレクトボックスを使用
					if (columnId === "returnStatus") {
						return (
							<ColoredSelectCell
								value={value}
								options={config.options.map((opt) => ({
									value: opt,
									label: returnStatusMap[opt as keyof typeof returnStatusMap],
									variant: returnStatusBadgeVariant[opt as keyof typeof returnStatusBadgeVariant] as
										| "default"
										| "secondary"
										| "destructive"
										| "outline",
									colors: returnStatusCustomColors[opt as keyof typeof returnStatusCustomColors]
										? {
												background:
													returnStatusCustomColors[opt as keyof typeof returnStatusCustomColors]
														.backgroundColor,
												text: returnStatusCustomColors[opt as keyof typeof returnStatusCustomColors]
													.color,
												border:
													returnStatusCustomColors[opt as keyof typeof returnStatusCustomColors]
														.borderColor,
											}
										: undefined,
								}))}
								onSave={handleSave}
							/>
						);
					}

					// その他の場合は通常のセレクトボックス
					return (
						<SelectCell
							value={value}
							options={config.options.map((opt) => ({
								value: opt,
								label: columnId === "type" ? typeLabels[opt as OfferingType] : opt,
							}))}
							onSave={handleSave}
						/>
					);
				case "additional-select":
					return (
						<AdditionalSelectCell
							row={cell.row.original as Record<string, unknown>}
							column={columnId}
							options={config.options}
							value={value as string | null}
							onValueChange={handleSave}
							onAddOption={async (option: SelectOption) => {
								if (
									config.type === "additional-select" &&
									typeof config.onAddOption === "function"
								) {
									// obtain the new relation ID and then save it
									const newId = await config.onAddOption(option, rowId);
									await handleSave(newId as string);
								} else {
									await handleSave(option.value);
								}
							}}
							addOptionPlaceholder={config.addOptionPlaceholder}
						/>
					);
				case "number":
					return (
						<EditableCell
							value={value as string | number | null}
							onSave={handleSave}
							type="number"
							format={config.format}
						/>
					);
				case "date":
					return (
						<DateCell
							trigger={
								<Button variant="outline" size="sm" className="w-full justify-start">
									{value as string | null}
								</Button>
							}
							value={value as string | null}
							onSave={handleSave}
						/>
					);
				case "postal_code":
					return (
						<EditableCell
							value={value as string | number | null}
							onSave={handleSave}
							format="postal_code"
						/>
					);
				case "searchable-selector": {
					if (!config.selectorItems) return null;
					const selectedIds = (value as string)?.split(",").filter(Boolean) || [];
					return (
						<SearchableSelectorDialog
							items={config.selectorItems}
							selectedIds={selectedIds}
							onSelectionChange={(newSelectedIds) => handleSave(newSelectedIds.join(","))}
							trigger={
								<Button variant="outline" size="sm" className="w-full justify-start">
									{selectedIds.length > 0 ? `${selectedIds.length}件選択中` : "選択してください"}
								</Button>
							}
							{...config.selectorConfig}
						/>
					);
				}
				default:
					return <EditableCell value={value as string | number | null} onSave={handleSave} />;
			}
		},
		[editableColumns, onCellEdit, permission],
	);

	return (
		<div className="rounded-md border overflow-hidden">
			<div className="relative">
				<Table>
					{/* ヘッダー部分: スティッキーポジションで固定表示 */}
					<TableHeader className={cn("sticky top-0 z-10 bg-background shadow-sm", headerClassName)}>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={cn(
											header.column.id === "select"
												? "w-8 px-2 bg-background border-r last:border-r-0"
												: "bg-background border-r last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis",
											cellClassName,
										)}
										style={{
											width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
											minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
											maxWidth: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className={bodyClassName}>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row, i) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={i % 2 === 0 ? "bg-background" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"border-r last:border-r-0 overflow-hidden text-ellipsis",
												cellClassName,
											)}
											style={{
												width:
													cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
												minWidth:
													cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
												maxWidth:
													cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
											}}
										>
											{renderCell(cell, cell.column.id)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
