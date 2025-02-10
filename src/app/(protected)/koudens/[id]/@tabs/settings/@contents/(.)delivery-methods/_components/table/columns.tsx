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
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";
import type { CellValue } from "@/types/table";
// constants
import { columnLabels } from "./constants";

interface ColumnProps {
	koudenId: string;
	onDelete?: (id: string) => void;
	permission?: KoudenPermission;
}

/**
 * 配送方法テーブルのカラム定義を作成する
 * @param props カラムの設定に必要なプロパティ
 * @returns カラム定義の配列
 */
export function createColumns({
	onDelete,
	permission,
}: ColumnProps): ColumnDef<DeliveryMethod, CellValue>[] {
	const columnHelper = createColumnHelper<DeliveryMethod>();
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
		columnHelper.display({
			id: "actions",
			header: columnLabels.actions,
			cell: ({ row }) => {
				const deliveryMethod = row.original;

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
									onClick={() => onDelete?.(deliveryMethod.id)}
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
