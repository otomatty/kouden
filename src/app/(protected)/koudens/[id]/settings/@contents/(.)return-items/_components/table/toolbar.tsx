"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EditReturnItemDialog } from "../dialogs/edit-return-item-dialog";

interface ReturnItemToolbarProps {
	koudenId: string;
}

/**
 * 返礼品マスタ設定のツールバーコンポーネント
 * - 返礼品の追加ボタンを表示
 * - 追加ダイアログの表示制御
 */
export function ReturnItemToolbar({ koudenId }: ReturnItemToolbarProps) {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	return (
		<div className="flex justify-end">
			<Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
				<Plus className="h-4 w-4 mr-2" />
				追加
			</Button>

			{/* 追加ダイアログ */}
			<EditReturnItemDialog
				koudenId={koudenId}
				returnItem={null}
				open={isAddDialogOpen}
				onClose={() => setIsAddDialogOpen(false)}
			/>
		</div>
	);
}

// 型定義のエクスポート
export type { ReturnItemToolbarProps };
