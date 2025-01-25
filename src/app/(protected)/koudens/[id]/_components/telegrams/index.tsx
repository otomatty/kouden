"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { telegramsAtom } from "@/atoms/telegrams";
import { TelegramsTable } from "./telegrams-table";
import { TelegramDialog } from "./telegram-dialog";
import { TelegramFilter } from "./telegram-filter";
import { TelegramSort } from "./telegram-sort";
import type { KoudenEntry } from "@/types/kouden";
import type { Telegram } from "@/atoms/telegrams";
import { useTelegramSync } from "@/hooks/useTelegramSync";

interface TelegramsViewProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	telegrams: Telegram[];
}

export function TelegramsView({
	koudenId,
	koudenEntries,
	telegrams: initialTelegrams,
}: TelegramsViewProps) {
	const setTelegrams = useSetAtom(telegramsAtom);

	// リアルタイム同期を設定
	useTelegramSync(koudenId);

	// マウント時に一度だけ初期データを設定
	useEffect(() => {
		console.log("Setting initial telegrams:", initialTelegrams);
		setTelegrams(initialTelegrams);
	}, [initialTelegrams, setTelegrams]);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div className="flex items-center justify-between">
					<TelegramFilter />
					<TelegramSort />
				</div>
				<TelegramDialog koudenId={koudenId} koudenEntries={koudenEntries} />
			</div>

			<TelegramsTable koudenId={koudenId} koudenEntries={koudenEntries} />
		</div>
	);
}
