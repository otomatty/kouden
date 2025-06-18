"use client";
// library
import { useState, useEffect } from "react";

// types
import type { OfferingWithKoudenEntries } from "@/types/offerings";
import type { Entry } from "@/types/entries"; //香典情報を参照するために必要
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { DataTable } from "./table/data-table";
import { OfferingCardList } from "./card-list/offering-card-list";
import { Loading } from "@/components/custom/loading";

interface OfferingViewProps {
	koudenId: string;
	offerings: OfferingWithKoudenEntries[];
	entries: Entry[];
}

// OfferingViewコンポーネント
// 役割：お供物の表示
export function OfferingView({ koudenId, entries, offerings }: OfferingViewProps) {
	const [data, setData] = useState<OfferingWithKoudenEntries[]>(offerings || []);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(offerings)) {
			console.error("[DEBUG] OfferingView - Invalid offerings data:", offerings);
			return;
		}
		setData(offerings);
	}, [offerings]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<OfferingCardList offerings={data} koudenId={koudenId} entries={entries} />
			) : (
				<DataTable
					koudenId={koudenId}
					offerings={data}
					entries={Array.isArray(entries) ? entries : []}
					onDataChange={setData}
				/>
			)}
		</>
	);
}
