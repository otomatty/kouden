"use client";

import { useState } from "react";
import { EntryDialog } from "../entries/dialog/entry-dialog";
import { OfferingDialog } from "../offerings/dialog/offering-dialog";
import { TelegramDialog } from "../telegrams/dialog/telegram-dialog";

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
interface MobileMenuProps {
	koudenId: string;
	viewMode: "table" | "statistics" | "offerings" | "telegrams" | "return-items" | "members";
	entries: Entry[];
	relationships: Relationship[];
	onEntryCreated?: (entry: Entry) => void;
}

export function MobileMenu({
	koudenId,
	viewMode,
	entries,
	relationships,
	onEntryCreated,
}: MobileMenuProps) {
	const [, setIsEntryDialogOpen] = useState(false);

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center md:hidden shadow-lg">
			{viewMode === "table" && (
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
			{viewMode === "offerings" && (
				<OfferingDialog variant="create" koudenId={koudenId} entries={entries} />
			)}
			{viewMode === "telegrams" && <TelegramDialog koudenId={koudenId} entries={entries} />}
		</div>
	);
}
