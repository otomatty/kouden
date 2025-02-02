"use client";

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { CrudDialog } from "@/components/custom/crud-dialog";
import { EntryForm } from "./entry-form";

export interface EntryDialogProps {
	koudenId: string;
	relationships: Relationship[];
	defaultValues?: Entry;
	variant?: "create" | "edit" | undefined; // undefinedはボタンが表示されないことを表す
	onSuccess?: (entry: Entry) => void;
}

export function EntryDialog({
	koudenId,
	relationships,
	defaultValues,
	variant,
	onSuccess,
}: EntryDialogProps) {
	return (
		<CrudDialog<Entry>
			title={variant === "create" ? "香典を登録する" : "編集する"}
			variant={variant}
			createButtonLabel="香典を登録する"
			editButtonLabel="編集する"
			onSuccess={onSuccess}
		>
			{({ close }) => (
				<EntryForm
					koudenId={koudenId}
					relationships={relationships}
					defaultValues={defaultValues}
					onSuccess={(entry) => {
						onSuccess?.(entry);
						close();
					}}
				/>
			)}
		</CrudDialog>
	);
}
