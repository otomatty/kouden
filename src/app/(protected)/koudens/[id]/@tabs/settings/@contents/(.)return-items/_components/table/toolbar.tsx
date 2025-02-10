"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ReturnItemToolbarProps {
	koudenId: string;
}

/**
 * 返礼品マスタ設定のツールバーコンポーネント
 * - 返礼品の追加ボタンを表示
 */
export function ReturnItemToolbar() {
	return (
		<div className="flex justify-end">
			<Button variant="outline" size="sm">
				<Plus className="h-4 w-4 mr-2" />
				追加
			</Button>
		</div>
	);
}

// 型定義のエクスポート
export type { ReturnItemToolbarProps };
