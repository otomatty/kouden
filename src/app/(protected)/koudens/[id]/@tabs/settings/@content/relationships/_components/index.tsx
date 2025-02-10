"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
// components
import { RelationshipTable } from "./table/table";
import { RelationshipCardList } from "./card-list/card-list";
// types
import type { Relationship } from "@/types/relationships";

interface RelationshipSectionProps {
	koudenId: string;
	relationships: Relationship[];
}

/**
 * 関係性設定セクションコンポーネント
 * - セクションの開閉制御
 * - 画面サイズに応じたUIの切り替え（テーブル/カードリスト）
 */
export function RelationshipSection({ koudenId, relationships }: RelationshipSectionProps) {
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
						<RelationshipTable koudenId={koudenId} relationships={relationships} />
					) : (
						<RelationshipCardList koudenId={koudenId} relationships={relationships} />
					)}
				</div>
			)}
		</div>
	);
}

// 型定義のエクスポート
export type { RelationshipSectionProps };
