"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash } from "lucide-react";
// types
import type { Relationship } from "@/types/relationships";

interface RelationshipCardListProps {
	koudenId: string;
	relationships: Relationship[];
}

/**
 * 関係性設定のモバイル表示用カードリストコンポーネント
 * - カード形式で関係性の一覧を表示
 * - 各カードで編集、削除、有効/無効の切り替えが可能
 */
export function RelationshipCardList({ relationships }: RelationshipCardListProps) {
	return (
		<div className="space-y-4">
			{/* 追加ボタン */}
			<div className="flex justify-end">
				<Button variant="outline" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					追加
				</Button>
			</div>

			{/* カードリスト */}
			<div className="space-y-4">
				{relationships.map((relationship) => (
					<div
						key={relationship.id}
						className="flex items-center justify-between p-4 border rounded-lg"
					>
						<div className="space-y-1">
							<div className="font-medium">{relationship.name}</div>
							{relationship.description && (
								<div className="text-sm text-muted-foreground">{relationship.description}</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={relationship.is_default} />
							<div className="flex flex-col gap-2">
								<Button variant="ghost" size="icon">
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon">
									<Trash className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// 型定義のエクスポート
export type { RelationshipCardListProps };
