"use client";
import { useEffect, useState } from "react";

// 独自の型
import type { KoudenEntry } from "@/types/kouden";
// カスタムフック
import { useMediaQuery } from "@/hooks/use-media-query";
// カスタムコンポーネント
import { DataTable } from "./table/data-table";
import { EntryDialog } from "./dialog/entry-dialog";
import { EntryCardList } from "./card-list/entry-card-list";

// Props
interface EntryViewProps {
	entries: KoudenEntry[];
	koudenId: string;
}

// EntryViewコンポーネント
// 役割：エントリーの表示
export function EntryView({ entries, koudenId }: EntryViewProps) {
	const [editingEntry, setEditingEntry] = useState<KoudenEntry | undefined>(
		undefined,
	);
	const [editingDialogOpen, setEditingDialogOpen] = useState(false);
	const [data, setData] = useState<KoudenEntry[]>(entries || []);
	const isMobile = useMediaQuery("(max-width: 767px)");

	return (
		<>
			{isMobile ? (
				<EntryCardList entries={data} koudenId={koudenId} />
			) : (
				<DataTable koudenId={koudenId} entries={data} onDataChange={setData} />
			)}

			<EntryDialog
				koudenId={koudenId}
				defaultValues={editingEntry}
				open={editingDialogOpen}
				onOpenChange={setEditingDialogOpen}
				onSuccess={(updatedEntry) => {
					setData((prevData) =>
						prevData.map((entry) =>
							entry.id === updatedEntry.id ? updatedEntry : entry,
						),
					);
					setEditingEntry(undefined);
					setEditingDialogOpen(false);
				}}
			/>
		</>
	);
}
