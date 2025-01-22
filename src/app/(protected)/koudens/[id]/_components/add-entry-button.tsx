"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EntryDialog } from "./entry-table/entry-dialog";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
} from "./entry-table/types";

interface AddEntryButtonProps {
	koudenId: string;
	onSave: (data: EditKoudenEntryFormData) => Promise<KoudenEntryTableData>;
	onSuccess?: (entry: KoudenEntryTableData) => void;
}

export function AddEntryButton({
	koudenId,
	onSave,
	onSuccess,
}: AddEntryButtonProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSave = async (data: EditKoudenEntryFormData) => {
		try {
			const newEntry = await onSave(data);
			onSuccess?.(newEntry);
			setIsOpen(false);
			return newEntry;
		} catch (error) {
			console.error("Failed to add entry:", error);
			throw error;
		}
	};

	return (
		<EntryDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			onSave={handleSave}
			koudenId={koudenId}
			trigger={
				<Button size="lg" className="w-full mx-4 flex items-center gap-2">
					<Plus className="h-6 w-6" />
					<span>香典を登録する</span>
				</Button>
			}
		/>
	);
}
