"use client";

import { AddEntryButton } from "./add-entry-button";
import { OfferingDialog } from "./offering-dialog";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
} from "./entry-table/types";
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
	onAddEntry: (data: EditKoudenEntryFormData) => Promise<KoudenEntryTableData>;
}

export function MobileMenu({
	koudenId,
	viewMode,
	koudenEntries,
	onAddEntry,
}: MobileMenuProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center md:hidden shadow-lg">
			{viewMode === "table" && (
				<AddEntryButton
					koudenId={koudenId}
					onSave={async (data) => {
						try {
							const response = await onAddEntry(data);
							return response;
						} catch (error) {
							console.error("MobileMenu: Failed to add entry", error);
							throw error;
						}
					}}
				/>
			)}
			{viewMode === "offerings" && (
				<OfferingDialog koudenId={koudenId} koudenEntries={koudenEntries} />
			)}
		</div>
	);
}
