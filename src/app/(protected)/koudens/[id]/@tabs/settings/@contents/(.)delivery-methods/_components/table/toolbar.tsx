"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { permissionAtom } from "@/store/permission";
// components
import { DeliveryMethodDialog } from "../dialog";

interface DeliveryMethodsToolbarProps {
	koudenId: string;
	onAdd?: () => void;
}

/**
 * 配送方法テーブルのツールバーコンポーネント
 * - 新規配送方法の追加ボタンを表示
 * - 権限に応じてボタンの表示/非表示を制御
 */
export function DeliveryMethodsToolbar({ koudenId, onAdd }: DeliveryMethodsToolbarProps) {
	const permission = useAtomValue(permissionAtom);
	const [open, setOpen] = useState(false);

	// 編集権限がない場合は何も表示しない
	if (permission !== "owner" && permission !== "editor") {
		return null;
	}

	const handleAdd = () => {
		setOpen(true);
		onAdd?.();
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Button onClick={handleAdd} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					配送方法を追加
				</Button>
			</div>
			<DeliveryMethodDialog
				koudenId={koudenId}
				open={open}
				onOpenChange={setOpen}
				onSubmit={async (values) => {
					// TODO: 追加処理の実装
					console.log("Add delivery method", values);
				}}
			/>
		</div>
	);
}

// 型定義のエクスポート
export type { DeliveryMethodsToolbarProps };
