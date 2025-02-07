"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { DataTable } from "@/components/custom/data-table";
import { permissionAtom } from "@/store/permission";
// components
import { ReturnItemMasterToolbar } from "./toolbar";
import { createColumns } from "./columns";
// types
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

interface ReturnItemMasterTableProps {
	koudenId: string;
	returnItemMasters: ReturnItemMaster[];
}

/**
 * 返礼品マスタ設定のデスクトップ表示用テーブルコンポーネント
 * - テーブル形式で返礼品マスタの一覧を表示
 * - 各行で編集、削除が可能
 */
export function ReturnItemMasterTable({ koudenId, returnItemMasters }: ReturnItemMasterTableProps) {
	const permission = useAtomValue(permissionAtom);
	const [sorting, setSorting] = useState([{ id: "name", desc: false }]);

	const handleDelete = async (id: string) => {
		// TODO: 削除処理の実装
		console.log("Delete return item master", id);
	};

	const columns = createColumns({
		koudenId,
		onDelete: handleDelete,
		permission,
	});

	return (
		<div className="space-y-4">
			{/* ツールバー */}
			<ReturnItemMasterToolbar />

			{/* テーブル */}
			<DataTable<ReturnItemMaster>
				permission={permission}
				columns={columns}
				data={returnItemMasters}
				sorting={sorting}
				onSortingChange={setSorting}
				emptyMessage="返礼品が登録されていません"
			/>
		</div>
	);
}
