"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { DataTable } from "@/components/custom/data-table";
import { permissionAtom } from "@/store/permission";
// components
import { ReturnItemToolbar } from "./toolbar";
import { createColumns } from "./columns";
// types
import type { ReturnItem } from "@/types/return-records/return-items";

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

	const handleDelete = async (id: string) => {
		// TODO: 削除処理の実装
		console.log("Delete return item", id);
	};

	const columns = createColumns({
		koudenId,
		onDelete: handleDelete,
		permission,
	});

	return (
		<div className="space-y-4">
			{/* ツールバー */}
			<ReturnItemToolbar />

			{/* テーブル */}
			<DataTable<ReturnItem>
				permission={permission}
				columns={columns}
				data={returnItems}
				sorting={sorting}
				onSortingChange={setSorting}
				emptyMessage="返礼品が登録されていません"
			/>
		</div>
	);
}
