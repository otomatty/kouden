"use client";

import { useAtomValue } from "jotai";
import { permissionAtom } from "@/store/permission";
import { canCreateData, canUpdateData } from "@/store/permission";
import type { Telegram } from "@/types/telegrams";
import type { Entry } from "@/types/entries";
import { CrudDialog } from "@/components/custom/crud-dialog";
import { TelegramForm } from "./telegram-form";

interface TelegramDialogProps {
	koudenId: string;
	entries: Entry[];
	defaultValues?: Telegram;
	variant?: "create" | "edit" | undefined; // undefinedはボタンが表示されないことを表す
	buttonClassName?: string;
	onSuccess?: (telegram: Telegram) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function TelegramDialog({
	koudenId,
	entries,
	defaultValues,
	variant,
	buttonClassName,
	onSuccess,
	onOpenChange,
}: TelegramDialogProps) {
	return (
		<CrudDialog
			title={variant === "create" ? "弔電を登録する" : "弔電を編集する"}
			variant={variant}
			buttonClassName={buttonClassName}
			createButtonLabel="弔電を登録する"
		>
			<TelegramForm
				koudenId={koudenId}
				entries={entries}
				defaultValues={defaultValues}
				onSuccess={(telegram) => {
					onSuccess?.(telegram);
					onOpenChange?.(false);
				}}
				onCancel={() => onOpenChange?.(false)}
			/>
		</CrudDialog>
	);
}
