"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
// components
import { DeliveryMethodTable } from "./table/table";
// import { DeliveryMethodCardList } from "./card-list/card-list";
// types
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";

interface DeliveryMethodSectionProps {
	koudenId: string;
	deliveryMethods: DeliveryMethod[];
}

/**
 * 配送方法設定セクションコンポーネント
 * - セクションの開閉制御
 * - 画面サイズに応じたUIの切り替え（テーブル/カードリスト）
 */
export function DeliveryMethodSection({ koudenId, deliveryMethods }: DeliveryMethodSectionProps) {
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
						<DeliveryMethodTable koudenId={koudenId} deliveryMethods={deliveryMethods} />
					) : (
						<div>ここにはモバイル用のカードリストが入る</div>
						// <DeliveryMethodCardList koudenId={koudenId} deliveryMethods={deliveryMethods} />
					)}
				</div>
			)}
		</div>
	);
}

// 型定義のエクスポート
export type { DeliveryMethodSectionProps };
