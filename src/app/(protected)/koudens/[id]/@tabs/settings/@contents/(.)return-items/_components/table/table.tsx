"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { DataTable } from "@/components/custom/data-table";
import { permissionAtom } from "@/store/permission";
// components
import { ReturnItemToolbar } from "./toolbar";
import { createColumns } from "./columns";
import { DeleteReturnItemDialog } from "../dialogs/delete-return-item-dialog";
import { EditReturnItemDialog } from "../dialogs/edit-return-item-dialog";
// types
import type { ReturnItem } from "@/types/return-records";

interface ReturnItemTableProps {
	koudenId: string;
	returnItems: ReturnItem[];
}

/**
 * 返礼品設定のデスクトップ表示用テーブルコンポーネント
 * - テーブル形式で返礼品の一覧を表示
 * - 各行で編集、削除が可能
 */
export function ReturnItemTable({ koudenId, returnItems }: ReturnItemTableProps) {
	const permission = useAtomValue(permissionAtom);
	const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
	const [deletingItem, setDeletingItem] = useState<ReturnItem | null>(null);
	const [editingItem, setEditingItem] = useState<ReturnItem | null>(null);

	const handleDelete = (returnItem: ReturnItem) => {
		setDeletingItem(returnItem);
	};

	const handleEdit = (returnItem: ReturnItem) => {
		setEditingItem(returnItem);
	};

	const columns = createColumns({
		koudenId,
		onDelete: handleDelete,
		onEdit: handleEdit,
		permission,
	});

	return (
		<div className="space-y-4">
			{/* ツールバー */}
			<ReturnItemToolbar koudenId={koudenId} />

			{/* テーブル */}
			<DataTable<ReturnItem>
				permission={permission}
				columns={columns}
				data={returnItems}
				sorting={sorting}
				onSortingChange={setSorting}
				emptyMessage="返礼品が登録されていません"
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
export type { ReturnItemTableProps };
