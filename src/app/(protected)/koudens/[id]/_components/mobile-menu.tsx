"use client";

import { ExportExcelButton } from "./export-excel-button";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { FeedbackButton } from "./feedback-button";
import { AddEntryButton } from "./add-entry-button";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
} from "./entry-table/types";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
	koudenId: string;
	koudenTitle: string;
	permission: "owner" | "editor" | "viewer" | null;
	onDelete: (id: string) => Promise<void>;
	onAddEntry: (data: EditKoudenEntryFormData) => Promise<KoudenEntryTableData>;
}

export function MobileMenu({
	koudenId,
	koudenTitle,
	permission,
	onDelete,
	onAddEntry,
}: MobileMenuProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 flex justify-center items-center gap-2 md:hidden shadow-lg">
			<ExportExcelButton koudenId={koudenId} />
			<Separator orientation="vertical" className="h-8" />
			<AddEntryButton
				koudenId={koudenId}
				onSave={async (data) => {
					console.log("MobileMenu: Attempting to add entry", data);
					try {
						const response = await onAddEntry(data);
						console.log("MobileMenu: Entry added successfully", response);
						return response;
					} catch (error) {
						console.error("MobileMenu: Failed to add entry", error);
						throw error;
					}
				}}
				onSuccess={(entry) => {
					console.log("MobileMenu: Entry added and UI updated", entry);
				}}
			/>
			<Separator orientation="vertical" className="h-8" />
			{permission === "owner" && (
				<DeleteKoudenDialog
					koudenId={koudenId}
					koudenTitle={koudenTitle}
					onDelete={onDelete}
				/>
			)}
			<Separator orientation="vertical" className="h-8" />
			{(permission === "owner" || permission === "editor") && (
				<>
					<DuplicateKoudenButton koudenId={koudenId} />
					<Separator orientation="vertical" className="h-8" />
				</>
			)}
			<Separator orientation="vertical" className="h-8" />
			<FeedbackButton />
		</div>
	);
}
