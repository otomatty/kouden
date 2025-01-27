"use client";
import { useState, useEffect } from "react";

// 独自の型
import type { KoudenEntry } from "@/types/kouden";
// カスタムフック
import { useMediaQuery } from "@/hooks/use-media-query";
// カスタムコンポーネント
import { DataTable } from "./table/data-table";
import { EntryCardList } from "./card-list/entry-card-list";
import { Loading } from "../_common/loading";

// Props
interface EntryViewProps {
	entries: KoudenEntry[];
	koudenId: string;
}

// EntryViewコンポーネント
// 役割：エントリーの表示
export function EntryView({ entries, koudenId }: EntryViewProps) {
	const [data, setData] = useState<KoudenEntry[]>(entries || []);
	const isMobile = useMediaQuery("(max-width: 767px)");

	// 初期レンダリング時はローディング状態を表示
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return <Loading message="表示モードを確認中..." />;
	}

	return (
		<>
			{isMobile ? (
				<EntryCardList entries={data} koudenId={koudenId} />
			) : (
				<DataTable koudenId={koudenId} entries={data} onDataChange={setData} />
			)}
		</>
	);
}
