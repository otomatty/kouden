"use client";
// library
import { useState, useEffect } from "react";

// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { DataTable } from "./table/data-table";
import { EntryCardList } from "./card-list/entry-card-list";
import { Loading } from "../../../../../../../components/custom/loading";

// Props
interface EntryViewProps {
	entries: Entry[];
	koudenId: string;
	relationships: Relationship[];
}

/**
 * EntryViewコンポーネント
 * 役割：エントリーの表示
 */
export function EntryView({ entries = [], koudenId, relationships = [] }: EntryViewProps) {
	const [data, setData] = useState<Entry[]>(entries);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(entries)) {
			console.error("Invalid entries data:", entries);
			return;
		}
		setData(entries);
	}, [entries]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<EntryCardList entries={data} koudenId={koudenId} relationships={relationships} />
			) : (
				<DataTable
					koudenId={koudenId}
					entries={Array.isArray(data) ? data : []}
					relationships={Array.isArray(relationships) ? relationships : []}
					onDataChange={setData}
				/>
			)}
		</>
	);
}
