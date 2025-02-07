"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { DataTable } from "@/components/custom/data-table";
import { permissionAtom } from "@/store/permission";
// components
import { DeliveryMethodToolbar } from "./toolbar";
import { createColumns } from "./columns";
// types
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";

interface DeliveryMethodTableProps {
	koudenId: string;
	deliveryMethods: DeliveryMethod[];
}

/**
 * 配送方法設定のデスクトップ表示用テーブルコンポーネント
 * - テーブル形式で配送方法の一覧を表示
 * - 各行で編集、削除が可能
 */
export function DeliveryMethodTable({
	koudenId,
	deliveryMethods = [], // デフォルト値を空配列に設定
}: DeliveryMethodTableProps) {
	const permission = useAtomValue(permissionAtom);
	const [sorting, setSorting] = useState([{ id: "name", desc: false }]);

	// 配列が未定義の場合は空配列を使用
	const methods = deliveryMethods ?? [];

	const handleDelete = async (id: string) => {
		// TODO: 削除処理の実装
		console.log("Delete delivery method", id);
	};

	const handleAdd = () => {
		// TODO: 追加処理の実装
		console.log("Add delivery method");
	};

	const columns = createColumns({
		koudenId,
		onDelete: handleDelete,
		permission,
	});

	return (
		<div className="space-y-4">
			{/* ツールバー */}
			<DeliveryMethodToolbar koudenId={koudenId} onAdd={handleAdd} />

			{/* テーブル */}
			<DataTable<DeliveryMethod>
				permission={permission}
				columns={columns}
				data={methods}
				sorting={sorting}
				onSortingChange={setSorting}
				emptyMessage="配送方法が登録されていません"
			/>
		</div>
	);
}

// 型定義のエクスポート
export type { DeliveryMethodTableProps };
