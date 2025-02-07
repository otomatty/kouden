"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RelationshipToolbarProps {
	koudenId: string;
}

/**
 * 関係性設定のツールバーコンポーネント
 * - 関係性の追加ボタンを表示
 */
export function RelationshipToolbar() {
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
export type { RelationshipToolbarProps };
