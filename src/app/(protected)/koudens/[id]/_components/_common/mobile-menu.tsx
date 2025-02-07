/**
 * モバイル用のアクションメニューコンポーネント
 * - URLセグメントに基づいて適切なダイアログを表示
 * - モバイル表示時のみ表示される
 */
"use client";

import { useState } from "react";
import { EntryDialog } from "../../@tabs/entries/_components/dialog/entry-dialog";
import { OfferingDialog } from "../../@tabs/offerings/_components/dialog/offering-dialog";
import { TelegramDialog } from "../../@tabs/telegrams/_components/dialog/telegram-dialog";

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";

interface MobileMenuProps {
	koudenId: string;
	segment: string | null;
	entries: Entry[];
	relationships: Relationship[];
	onEntryCreated?: (entry: Entry) => void;
}

export function MobileMenu({
	koudenId,
	segment,
	entries,
	relationships,
	onEntryCreated,
}: MobileMenuProps) {
	const [, setIsEntryDialogOpen] = useState(false);

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center md:hidden shadow-lg">
			{segment === "entries" && (
				<EntryDialog
					variant="create"
					koudenId={koudenId}
					relationships={relationships}
					defaultValues={undefined}
					onSuccess={(entry) => {
						onEntryCreated?.(entry);
						setIsEntryDialogOpen(false);
					}}
				/>
			)}
			{segment === "offerings" && (
				<OfferingDialog variant="create" koudenId={koudenId} entries={entries} />
			)}
			{segment === "telegrams" && <TelegramDialog koudenId={koudenId} entries={entries} />}
		</div>
	);
}
