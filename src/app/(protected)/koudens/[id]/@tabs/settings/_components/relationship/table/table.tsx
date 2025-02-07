"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { DataTable } from "@/components/custom/data-table";
import { permissionAtom } from "@/store/permission";
// components
import { RelationshipToolbar } from "./toolbar";
import { createColumns } from "./columns";
// types
import type { Relationship } from "@/types/relationships";

interface RelationshipTableProps {
	koudenId: string;
	relationships: Relationship[];
}

/**
 * 関係性設定のデスクトップ表示用テーブルコンポーネント
 * - テーブル形式で関係性の一覧を表示
 * - 各行で編集、削除、デフォルト設定の切り替えが可能
 */
export function RelationshipTable({ koudenId, relationships }: RelationshipTableProps) {
	const permission = useAtomValue(permissionAtom);
	const [sorting, setSorting] = useState([{ id: "name", desc: false }]);

	const handleDelete = async (id: string) => {
		// TODO: 削除処理の実装
		console.log("Delete relationship", id);
	};

	const columns = createColumns({
		koudenId,
		onDelete: handleDelete,
		permission,
	});

	return (
		<div className="space-y-4">
			{/* ツールバー */}
			<RelationshipToolbar />

			{/* テーブル */}
			<DataTable<Relationship>
				permission={permission}
				columns={columns}
				data={relationships}
				sorting={sorting}
				onSortingChange={setSorting}
				emptyMessage="関係性が登録されていません"
			/>
		</div>
	);
}

// 型定義のエクスポート
export type { RelationshipTableProps };
