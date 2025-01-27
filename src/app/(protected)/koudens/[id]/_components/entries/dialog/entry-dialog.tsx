"use client";

import { useAtomValue } from "jotai";
import { permissionAtom } from "@/store/permission";
import { canCreateEntry, canUpdateEntry } from "@/store/permission";
import type { KoudenEntry } from "@/types/kouden";
import { CrudDialog } from "@/components/custom/crud-dialog";
import { EntryForm } from "./entry-form";

export interface EntryDialogProps {
	koudenId: string;
	defaultValues?: KoudenEntry;
	variant?: "create" | "edit";
	buttonClassName?: string;
	onSuccess?: (entry: KoudenEntry) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function EntryDialog({
	koudenId,
	defaultValues,
	variant,
	buttonClassName,
	onSuccess,
	open,
	onOpenChange,
}: EntryDialogProps) {
	const permission = useAtomValue(permissionAtom);

	return (
		<CrudDialog<KoudenEntry>
			title={variant === "create" ? "新規香典記録" : "香典記録の編集"}
			variant={variant}
			buttonClassName={buttonClassName}
			open={open}
			onOpenChange={onOpenChange}
			canCreate={canCreateEntry(permission)}
			canUpdate={canUpdateEntry(permission)}
			createButtonLabel="香典を登録する"
			editButtonLabel="編集"
		>
			<EntryForm
				koudenId={koudenId}
				defaultValues={defaultValues}
				onSuccess={(entry) => {
					onSuccess?.(entry);
					onOpenChange?.(false);
				}}
				onCancel={() => onOpenChange?.(false)}
			/>
		</CrudDialog>
	);
}
