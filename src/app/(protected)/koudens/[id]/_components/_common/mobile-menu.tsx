"use client";

import { EntryDialog } from "../entries/dialog/entry-dialog";
import { OfferingDialog } from "../offerings/dialog";
import { TelegramDialog } from "../telegrams/dialog";
import { useAtom } from "jotai";
import { telegramDialogAtom } from "@/store/telegrams";

import type { KoudenEntry } from "@/types/kouden";

interface MobileMenuProps {
	koudenId: string;
	viewMode:
		| "table"
		| "statistics"
		| "offerings"
		| "telegrams"
		| "return-items"
		| "members";
	koudenEntries: KoudenEntry[];
}

export function MobileMenu({
	koudenId,
	viewMode,
	koudenEntries,
}: MobileMenuProps) {
	const [{ isOpen }, setDialogState] = useAtom(telegramDialogAtom);

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center md:hidden shadow-lg">
			{viewMode === "table" && (
				<EntryDialog koudenId={koudenId} defaultValues={undefined} />
			)}
			{viewMode === "offerings" && (
				<OfferingDialog koudenId={koudenId} koudenEntries={koudenEntries} />
			)}
			{viewMode === "telegrams" && (
				<TelegramDialog koudenId={koudenId} koudenEntries={koudenEntries} />
			)}
		</div>
	);
}
