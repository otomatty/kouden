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
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSuccess?: (entry: Entry) => void;
	trigger?: React.ReactNode;
	/**
	 * Shortcut key to open the dialog (with Ctrl/Cmd + key).
	 */
	shortcutKey?: string;
}

export function EntryDialog({
	koudenId,
	relationships,
	defaultValues,
	variant,
	onSuccess,
	open,
	onOpenChange,
	trigger,
	shortcutKey,
}: EntryDialogProps) {
	return (
		<CrudDialog<Entry>
			open={open}
			onOpenChange={onOpenChange}
			title={variant === "create" ? "香典を登録する" : "編集する"}
			variant={variant}
			shortcutKey={shortcutKey}
			createButtonLabel="香典を登録する"
			editButtonLabel="編集する"
			onSuccess={onSuccess}
			trigger={trigger}
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
