import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	ArrowUpDown,
	Pencil,
	Trash2,
	MoreHorizontal,
	Copy,
	Flower2,
	Gift,
	Package,
	ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KoudenPermission } from "@/app/_actions/koudens";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { Offering } from "@/types/offering";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EditableColumnConfig } from "@/components/custom/data-table/types";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { OfferingPhotoGallery } from "../photo-gallery";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { deleteOffering, updateOfferingPhoto } from "@/app/_actions/offerings";

const typeIcons = {
	FLOWER: <Flower2 className="h-4 w-4" />,
	FOOD: <Gift className="h-4 w-4" />,
	OTHER: <Package className="h-4 w-4" />,
} as const;

const typeLabels = {
	FLOWER: "供花",
	FOOD: "供物",
	OTHER: "その他",
} as const;

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	type: "種類",
	provider_name: "提供者名",
	description: "内容",
	price: "金額",
	quantity: "数量",
	notes: "備考",
	offering_photos: "写真",
	actions: "アクション",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "provider_name", label: "提供者名" },
	{ value: "description", label: "内容" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "price_desc", label: "金額が高い順" },
	{ value: "price_asc", label: "金額が低い順" },
	{ value: "provider_name_asc", label: "提供者名順" },
];

// フィルターオプションの定義
export const filterOptions = [
	{ value: "FLOWER", label: "供花" },
	{ value: "FOOD", label: "供物" },
	{ value: "OTHER", label: "その他" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	notes: false,
	offering_photos: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	description: false,
	quantity: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	provider_name: { type: "text" },
	description: { type: "text" },
	price: { type: "number", format: "currency" },
	quantity: { type: "number" },
	notes: { type: "text" },
	type: {
		type: "select",
		options: [
			{ value: "FLOWER", label: "供花" },
			{ value: "FOOD", label: "供物" },
			{ value: "OTHER", label: "その他" },
		],
	},
	// 編集不可のカラム
	select: { type: "readonly" },
	actions: { type: "readonly" },
	offering_photos: { type: "readonly" },
};

interface ColumnProps {
	onEditRow: (offering: Offering) => void;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	permission?: KoudenPermission;
}

export function createColumns({
	onEditRow,
	onDeleteRows,
	selectedRows,
	permission,
}: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<Offering> }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="全選択"
				/>
			),
			cell: ({ row }: { row: Row<Offering> }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="行を選択"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "type",
			header: ({ column }: { column: Column<Offering> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					種類
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Offering> }) => {
				const type = row.getValue("type") as keyof typeof typeIcons;
				return (
					<div className="flex items-center gap-2">
						{typeIcons[type]}
						<span>{typeLabels[type]}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "provider_name",
			header: ({ column }: { column: Column<Offering> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					提供者名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Offering> }) => row.getValue("provider_name"),
		},
		{
			accessorKey: "description",
			header: "内容",
			cell: ({ row }: { row: Row<Offering> }) => {
				const quantity = row.original.quantity;
				const description = row.getValue("description") as string | null;
				return (
					<div className="flex items-center gap-2">
						<span>{description || "-"}</span>
						<Badge variant="secondary">{quantity}点</Badge>
					</div>
				);
			},
		},
		{
			accessorKey: "price",
			header: ({ column }: { column: Column<Offering> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Offering> }) => {
				const price = row.getValue("price") as number | null;
				return price ? formatCurrency(price) : "-";
			},
		},
		{
			accessorKey: "quantity",
			header: "数量",
			cell: ({ row }: { row: Row<Offering> }) => {
				const quantity = row.getValue("quantity") as number;
				return <Badge variant="secondary">{quantity}点</Badge>;
			},
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<Offering> }) => row.getValue("notes") || "-",
		},
		{
			accessorKey: "offering_photos",
			header: "写真",
			cell: ({ row }: { row: Row<Offering> }) => {
				const photos = row.original.offering_photos;
				const [isGalleryOpen, setIsGalleryOpen] = useState(false);

				if (photos.length === 0) {
					return (
						<div className="flex items-center gap-2 text-muted-foreground">
							<ImageIcon className="h-4 w-4" />
							<span className="text-sm">なし</span>
						</div>
					);
				}

				const handleCaptionChange = async (
					photoId: string,
					caption: string,
				) => {
					try {
						await updateOfferingPhoto(photoId, { caption });
						toast({
							title: "キャプションを更新しました",
						});
					} catch (error) {
						toast({
							title: "キャプションの更新に失敗しました",
							variant: "destructive",
						});
					}
				};

				return (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsGalleryOpen(true)}
							className="relative h-8 w-8 rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
						>
							<Image
								src={`/api/storage/${photos[0].storage_key}`}
								alt={photos[0].caption || "写真"}
								className="object-cover"
								fill
								sizes="32px"
							/>
						</button>
						<Badge variant="secondary">{photos.length}枚</Badge>
						{isGalleryOpen && (
							<OfferingPhotoGallery
								photos={photos}
								onCaptionChange={handleCaptionChange}
							/>
						)}
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }: { row: Row<Offering> }) => {
				const offering = row.original;
				const isSelected = selectedRows.includes(offering.id);

				const handleDelete = async () => {
					try {
						await deleteOffering(offering.id);
						toast({
							title: "お供え物を削除しました",
						});
					} catch (error) {
						toast({
							title: "お供え物の削除に失敗しました",
							variant: "destructive",
						});
					}
				};

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">メニューを開く</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>アクション</DropdownMenuLabel>
							{canEdit && (
								<>
									<DropdownMenuItem onClick={() => onEditRow(offering)}>
										<Pencil className="h-4 w-4 mr-2" />
										編集
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => navigator.clipboard.writeText(offering.id)}
									>
										<Copy className="h-4 w-4 mr-2" />
										IDをコピー
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleDelete}
										disabled={isSelected}
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										削除
									</DropdownMenuItem>
								</>
							)}
							{!canEdit && (
								<DropdownMenuItem
									onClick={() => navigator.clipboard.writeText(offering.id)}
								>
									<Copy className="h-4 w-4 mr-2" />
									IDをコピー
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
