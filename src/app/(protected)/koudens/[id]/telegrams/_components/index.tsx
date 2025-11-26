"use client";
import { Loading } from "@/components/custom/loading";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// types
import type { Entry } from "@/types/entries";
import type { Telegram } from "@/types/telegrams";
// library
import { useEffect, useState } from "react";
import { TelegramCardList } from "./card-list/telegram-card-list";
// components
import { DataTable } from "./table/data-table";
// Props
interface TelegramsViewProps {
	telegrams: Telegram[];
	koudenId: string;
	entries: Entry[];
}

export function TelegramsView({ telegrams, koudenId, entries }: TelegramsViewProps) {
	const [data, setData] = useState<Telegram[]>(telegrams);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(telegrams)) {
			console.error("Invalid telegrams data:", telegrams);
			return;
		}
		setData(telegrams);
	}, [telegrams]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<TelegramCardList telegrams={data} koudenId={koudenId} entries={entries} />
			) : (
				<DataTable
					koudenId={koudenId}
					telegrams={Array.isArray(data) ? data : []}
					entries={Array.isArray(entries) ? entries : []}
					onDataChange={setData}
				/>
			)}
		</>
	);
}
