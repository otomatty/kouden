"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReturnItemTable } from "./table/table";
// import { ReturnItemMasterCardList } from "./card-list/card-list";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemSectionProps {
	koudenId: string;
	returnItems: ReturnItem[];
}

/**
 * 返礼品マスタ設定セクションコンポーネント
 * - セクションの開閉制御
 * - 画面サイズに応じたUIの切り替え（テーブル/カードリスト）
 * - 返礼品マスタの追加・編集・W削除
 */
export function ReturnItemSection({ koudenId, returnItems = [] }: ReturnItemSectionProps) {
	// セクションの開閉状態
	const [isOpen, setIsOpen] = useState(true);
	// 画面サイズの判定
	const isDesktop = useMediaQuery("(min-width: 768px)");

	return (
		<div className="space-y-4">
			{/* セクションヘッダー */}
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					className="p-0 hover:bg-transparent"
					onClick={() => setIsOpen(!isOpen)}
				>
					{isOpen ? (
						<ChevronUp className="h-4 w-4 text-muted-foreground" />
					) : (
						<ChevronDown className="h-4 w-4 text-muted-foreground" />
					)}
					<span className="sr-only">{isOpen ? "セクションを閉じる" : "セクションを開く"}</span>
				</Button>
			</div>

			{/* セクションコンテンツ */}
			{isOpen && (
				<div className="space-y-4">
					{isDesktop ? (
						<ReturnItemTable koudenId={koudenId} returnItems={returnItems} />
					) : (
						<div>モバイル表示用のコンポーネントは未実装です</div>
						// <ReturnItemMasterCardList koudenId={koudenId} returnItemMasters={returnItemMasters} />
					)}
				</div>
			)}
		</div>
	);
}

// 型定義のエクスポート
export type { ReturnItemSectionProps };
