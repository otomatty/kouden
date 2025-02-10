"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// types
import type { KoudenPermission } from "@/types/role";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import type { CellValue } from "@/types/table";
// constants
import { columnLabels } from "./constants";

interface ColumnProps {
	koudenId: string;
	onDelete?: (id: string) => void;
	permission?: KoudenPermission;
}

/**
 * 返礼品マスタテーブルのカラム定義を作成する
 * @param props カラムの設定に必要なプロパティ
 * @returns カラム定義の配列
 */
export function createColumns({
	onDelete,
	permission,
}: ColumnProps): ColumnDef<ReturnItemMaster, CellValue>[] {
	const columnHelper = createColumnHelper<ReturnItemMaster>();
	const canEdit = permission === "owner" || permission === "editor";

	return [
		columnHelper.accessor((row) => row.name as CellValue, {
			id: "name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{columnLabels.name}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		}),
		columnHelper.accessor((row) => row.description as CellValue, {
			id: "description",
			header: columnLabels.description,
		}),
		columnHelper.accessor((row) => row.price as CellValue, {
			id: "price",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{columnLabels.price}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ getValue }) => {
				const price = getValue() as number;
				return new Intl.NumberFormat("ja-JP", {
					style: "currency",
					currency: "JPY",
				}).format(price);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: columnLabels.actions,
			cell: ({ row }) => {
				const item = row.original;

				if (!canEdit) {
					return null;
				}

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<button
									type="button"
									onClick={() => onDelete?.(item.id)}
									className="text-destructive w-full justify-start"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									削除する
								</button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		}),
	];
}
