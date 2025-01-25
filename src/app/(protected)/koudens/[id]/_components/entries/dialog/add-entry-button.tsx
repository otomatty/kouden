"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryDialog } from "../dialog/entry-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { KoudenEntryTableData } from "../types";

interface AddEntryButtonProps {
	koudenId: string;
	onSuccess?: (entry: KoudenEntryTableData) => void;
}

export function AddEntryButton({ koudenId, onSuccess }: AddEntryButtonProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	return (
		<EntryDialog
			koudenId={koudenId}
			onSuccess={onSuccess}
			trigger={
				<Button
					size={isMobile ? "lg" : "default"}
					className={
						isMobile
							? "w-full mx-4 flex items-center gap-2"
							: "flex items-center gap-2"
					}
				>
					<Plus className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
					<span>香典を登録する</span>
				</Button>
			}
		/>
	);
}
