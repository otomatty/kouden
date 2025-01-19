"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
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
	const isDesktop = useMediaQuery("(min-width: 768px)");
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

	if (isDesktop) {
		return (
			<EntryDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				onSave={handleSave}
				koudenId={koudenId}
				trigger={
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						<span>新規追加</span>
					</Button>
				}
			/>
		);
	}

	return (
		<EntryDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			onSave={handleSave}
			koudenId={koudenId}
			trigger={
				<button
					type="button"
					className="flex flex-col items-center gap-1.5 min-w-[72px] py-2 px-3 text-primary hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
				>
					<Plus className="h-5 w-5" />
					<span className="text-xs font-medium">新規追加</span>
				</button>
			}
		/>
	);
}
