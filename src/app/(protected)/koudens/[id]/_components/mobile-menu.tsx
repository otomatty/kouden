"use client";

import { AddEntryButton } from "./add-entry-button";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
} from "./entry-table/types";

interface MobileMenuProps {
	koudenId: string;
	onAddEntry: (data: EditKoudenEntryFormData) => Promise<KoudenEntryTableData>;
}

export function MobileMenu({ koudenId, onAddEntry }: MobileMenuProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center md:hidden shadow-lg">
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
		</div>
	);
}
