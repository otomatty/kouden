import { Suspense } from "react";
import { SettingsView } from "./_components";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";
import type { Relationship } from "@/types/relationships";

// actions
import { getReturnItemMasters } from "@/app/_actions/return-records/return-item-masters";
import { getDeliveryMethods } from "@/app/_actions/return-records/delivery-methods";
import { getRelationships } from "@/app/_actions/relationships";

interface SettingsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 設定（settings）のページコンポーネント
 * - 香典帳の各種設定を表示
 * - 返礼品マスター、配送方法、関係性の設定
 */
export default async function SettingsPage({ params }: SettingsPageProps) {
	const { id: koudenId } = await params;
	// TODO: データの取得処理を実装
	const [returnItemMasters, deliveryMethods, relationships] = await Promise.all([
		getReturnItemMasters(koudenId),
		getDeliveryMethods(koudenId),
		getRelationships(koudenId),
	]);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SettingsView
				koudenId={koudenId}
				returnItemMasters={returnItemMasters}
				deliveryMethods={deliveryMethods}
				relationships={relationships}
			/>
		</Suspense>
	);
}
