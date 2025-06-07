"use client";

import { useState } from "react";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { EntryView } from "./_components";
import { EntryDialog } from "./_components/dialog/entry-dialog";
import MobileNavigation from "../_components/_common/MobileNavigation";
import { BottomNavigation } from "@/components/custom/bottom-navigation";

interface EntriesPageClientProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
}

export default function EntriesPageClient({
	koudenId,
	entries,
	relationships,
	totalCount,
	currentPage,
	pageSize,
}: EntriesPageClientProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<EntryView
				koudenId={koudenId}
				entries={entries}
				relationships={relationships}
				totalCount={totalCount}
				currentPage={currentPage}
				pageSize={pageSize}
			/>
			<EntryDialog
				koudenId={koudenId}
				relationships={relationships}
				variant="create"
				open={open}
				onOpenChange={setOpen}
				trigger={null}
			/>
		</>
	);
}
