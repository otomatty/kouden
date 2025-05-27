"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ReturnItem } from "@/types/return-records";

interface ReturnItemCardProps {
	returnItem: ReturnItem;
	onEdit: (returnItem: ReturnItem) => void;
	onDelete: (returnItem: ReturnItem) => void;
}

/**
 * 返礼品カードコンポーネント
 * - 個別の返礼品情報を表示
 * - 編集・削除機能を提供
 */
export function ReturnItemCard({ returnItem, onEdit, onDelete }: ReturnItemCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-bold">{returnItem.name}</CardTitle>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">メニューを開く</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(returnItem)}>
							<Pencil className="mr-2 h-4 w-4" />
							編集
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onDelete(returnItem)} className="text-destructive">
							<Trash2 className="mr-2 h-4 w-4" />
							削除
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{returnItem.description && (
						<p className="text-sm text-muted-foreground">{returnItem.description}</p>
					)}
					<p className="text-sm font-medium">¥{returnItem.price.toLocaleString()}</p>
				</div>
			</CardContent>
		</Card>
	);
}

// 型定義のエクスポート
export type { ReturnItemCardProps };
