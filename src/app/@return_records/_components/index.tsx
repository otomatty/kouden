"use client";

import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Loading } from "../../../components/custom/loading";
import { ReturnRecordTable } from "./table/data-table";
import { ReturnRecordCardList } from "./card-list/return-record-card-list";
import type { ReturnRecord } from "@/types/return-records/return-records";
import type { Entry } from "@/types/entries";
import type { DeliveryMethod } from "@/types/delivery-methods";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

interface ReturnRecordViewProps {
	returnRecords: ReturnRecord[];
	koudenId: string;
	entries: Entry[];
	deliveryMethods: DeliveryMethod[];
	returnItemMasters: ReturnItemMaster[];
}

/**
 * ReturnRecordViewコンポーネント
 * 役割：返礼情報の表示
 */
export function ReturnRecordView({
	returnRecords = [],
	koudenId,
	entries,
	deliveryMethods,
	returnItemMasters,
}: ReturnRecordViewProps) {
	const [data, setData] = useState<ReturnRecord[]>(returnRecords);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(returnRecords)) {
			console.error("Invalid return records data:", returnRecords);
			return;
		}
		setData(returnRecords);
	}, [returnRecords]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<ReturnRecordCardList
					returnRecords={data}
					koudenId={koudenId}
					deliveryMethods={deliveryMethods}
					returnItemMasters={returnItemMasters}
				/>
			) : (
				<ReturnRecordTable
					koudenId={koudenId}
					koudenEntryId={entries[0]?.id}
					returnRecords={Array.isArray(data) ? data : []}
					onDataChange={setData}
					deliveryMethods={deliveryMethods}
					returnItemMasters={returnItemMasters}
				/>
			)}
		</>
	);
}
