import { Suspense } from "react";
import { ReturnRecordView } from "./_components";
import type { ReturnRecord } from "@/types/return-records/return-records";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";
import type { Entry } from "@/types/entries";

// actions
import { getReturnRecords } from "@/app/_actions/return-records/return-records";
import { getReturnItemMasters } from "@/app/_actions/return-records/return-item-masters";
import { getDeliveryMethods } from "@/app/_actions/return-records/delivery-methods";
import { getEntries } from "@/app/_actions/entries";

// components
import { Loading } from "@/components/custom/loading";

interface ReturnRecordsPageProps {
	params: {
		id: string;
	};
}

/**
 * 返礼品（return-records）のページコンポーネント
 * - 返礼品情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 */
export default async function ReturnRecordsPage({ params }: ReturnRecordsPageProps) {
	// TODO: データの取得処理を実装
	const returnRecords: ReturnRecord[] = await getReturnRecords(params.id);
	const entries: Entry[] = await getEntries(params.id);
	const returnItemMasters: ReturnItemMaster[] = await getReturnItemMasters(params.id);
	const deliveryMethods: DeliveryMethod[] = await getDeliveryMethods(params.id);

	return (
		<Suspense fallback={<Loading message="データを読み込み中..." />}>
			<ReturnRecordView
				koudenId={params.id}
				entries={entries}
				returnRecords={returnRecords}
				returnItemMasters={returnItemMasters}
				deliveryMethods={deliveryMethods}
			/>
		</Suspense>
	);
}
