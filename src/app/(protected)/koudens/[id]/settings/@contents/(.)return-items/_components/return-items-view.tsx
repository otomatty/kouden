"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { ReturnItemTable } from "./table/table";
import { ReturnItemCardList } from "./card-list/card-list";
// types
import type { ReturnItem } from "@/types/return-records";

interface ReturnItemsViewProps {
	koudenId: string;
	returnItems: ReturnItem[];
}

/**
 * 返礼品設定セクションコンポーネント
 * - セクションの開閉制御
 * - 画面サイズに応じたUIの切り替え（テーブル/カードリスト）
 */
export function ReturnItemsView({ koudenId, returnItems }: ReturnItemsViewProps) {
	// 画面サイズの判定
	const isDesktop = useMediaQuery("(min-width: 768px)");

	return (
		<div className="space-y-4">
			{/* セクションコンテンツ */}
			<div className="space-y-4">
				{isDesktop ? (
					<ReturnItemTable koudenId={koudenId} returnItems={returnItems} />
				) : (
					<ReturnItemCardList koudenId={koudenId} returnItems={returnItems} />
				)}
			</div>
		</div>
	);
}

// 型定義のエクスポート
export type { ReturnItemsViewProps };
