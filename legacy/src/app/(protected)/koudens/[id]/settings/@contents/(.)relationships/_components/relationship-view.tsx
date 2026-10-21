"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { RelationshipTable } from "./table/table";
import { RelationshipCardList } from "./card-list/card-list";
// types
import type { Relationship } from "@/types/relationships";
// actions

interface RelationshipsViewProps {
	koudenId: string;
	relationships: Relationship[];
}

/**
 * 関係性設定セクションコンポーネント
 * - セクションの開閉制御
 * - 画面サイズに応じたUIの切り替え（テーブル/カードリスト）
 */
export function RelationshipsView({ koudenId, relationships }: RelationshipsViewProps) {
	// 画面サイズの判定
	const isDesktop = useMediaQuery("(min-width: 768px)");

	return (
		<div className="space-y-4">
			{/* セクションコンテンツ */}
			<div className="space-y-4">
				{isDesktop ? (
					<RelationshipTable koudenId={koudenId} relationships={relationships} />
				) : (
					<RelationshipCardList koudenId={koudenId} relationships={relationships} />
				)}
			</div>
		</div>
	);
}

// 型定義のエクスポート
export type { RelationshipsViewProps };
