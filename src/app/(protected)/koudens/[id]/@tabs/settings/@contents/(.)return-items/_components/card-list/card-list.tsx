"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReturnItemCard } from "./return-item-card";
import type { ReturnItem } from "@/types/return-records";
import { useState } from "react";
import { EditReturnItemDialog } from "../dialogs/edit-return-item-dialog";
import { DeleteReturnItemDialog } from "../dialogs/delete-return-item-dialog";

interface ReturnItemCardListProps {
	koudenId: string;
	returnItems: ReturnItem[];
}

/**
 * 返礼品カードリストコンポーネント
 * - モバイル向けのカードベースUI
 * - 各返礼品の表示、編集、削除機能を提供
 */
export function ReturnItemCardList({ koudenId, returnItems }: ReturnItemCardListProps) {
	// 編集・削除ダイアログの状態管理
	const [editingItem, setEditingItem] = useState<ReturnItem | null>(null);
	const [deletingItem, setDeletingItem] = useState<ReturnItem | null>(null);
	const [, setIsAddDialogOpen] = useState(false);

	// 編集ダイアログを開く
	const handleEdit = (returnItem: ReturnItem) => {
		setEditingItem(returnItem);
	};

	// 削除ダイアログを開く
	const handleDelete = (returnItem: ReturnItem) => {
		setDeletingItem(returnItem);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">返礼品一覧</h2>
				<Button onClick={() => setIsAddDialogOpen(true)} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					返礼品を追加
				</Button>
			</div>

			<div className="space-y-4">
				{returnItems.map((item) => (
					<ReturnItemCard
						key={item.id}
						returnItem={item}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				))}
			</div>

			{/* 追加ダイアログ */}
			<EditReturnItemDialog
				koudenId={koudenId}
				returnItem={null}
				onClose={() => setIsAddDialogOpen(false)}
			/>

			{/* 編集ダイアログ */}
			<EditReturnItemDialog
				koudenId={koudenId}
				returnItem={editingItem}
				onClose={() => setEditingItem(null)}
			/>

			{/* 削除ダイアログ */}
			<DeleteReturnItemDialog
				koudenId={koudenId}
				returnItem={deletingItem}
				onClose={() => setDeletingItem(null)}
			/>
		</div>
	);
}

// 型定義のエクスポート
export type { ReturnItemCardListProps };
