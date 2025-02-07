"use client";

import { Suspense } from "react";
import { CollapsibleCard } from "@/components/custom/collapsible-card";
// sections
import { RelationshipSection } from "./relationship";
import { ReturnItemMasterSection } from "./return-item-master";
import { DeliveryMethodSection } from "./delivery-method";
// types
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";
import type { Relationship } from "@/types/relationships";

interface SettingsViewProps {
	koudenId: string;
	returnItemMasters: ReturnItemMaster[];
	deliveryMethods: DeliveryMethod[];
	relationships: Relationship[];
}

/**
 * 香典帳の設定を管理するコンポーネント
 * - 返礼品マスター、配送方法、関係性の設定を表示する
 * - 各セクションは折りたためるようになっている
 * - 各セクションの追加、編集、削除はそれぞれのコンポーネントで管理する
 */
export function SettingsView({
	koudenId,
	returnItemMasters,
	deliveryMethods,
	relationships,
}: SettingsViewProps) {
	return (
		<Suspense>
			<div className="space-y-6">
				{/* 返礼品マスター設定 */}
				<CollapsibleCard
					title="返礼品マスター設定"
					description="この香典帳で使用する返礼品を管理します。返礼品の追加、編集、削除が可能です。"
				>
					<ReturnItemMasterSection koudenId={koudenId} returnItemMasters={returnItemMasters} />
				</CollapsibleCard>

				{/* 配送方法設定 */}
				<CollapsibleCard
					title="配送方法設定"
					description="返礼品の配送方法を管理します。配送方法の追加、編集、削除が可能です。"
				>
					<DeliveryMethodSection koudenId={koudenId} deliveryMethods={deliveryMethods} />
				</CollapsibleCard>

				{/* 関係性設定 */}
				<CollapsibleCard
					title="関係性設定"
					description="香典帳での関係性を管理します。関係性の追加、編集、削除が可能です。"
				>
					<RelationshipSection koudenId={koudenId} relationships={relationships} />
				</CollapsibleCard>
			</div>
		</Suspense>
	);
}

// 型定義のエクスポート
export type { SettingsViewProps, ReturnItemMaster, DeliveryMethod, Relationship };
