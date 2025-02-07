"use client";

import { OfferingForm } from "./offering-form";
import { useAtomValue } from "jotai";
import { permissionAtom } from "@/store/permission";
import { canCreateData, canUpdateData } from "@/store/permission";
import { CrudDialog } from "@/components/custom/crud-dialog";
import type { Entry } from "@//types/entries";
import type { Offering } from "@/types/offerings";

export interface OfferingDialogProps {
	koudenId: string;
	entries: Entry[];
	defaultValues?: Offering;
	variant?: "create" | "edit" | undefined; // undefinedはボタンが表示されないことを表す
	buttonClassName?: string;
	onSuccess?: (offering: Offering) => void;
}

export function OfferingDialog({
	koudenId,
	entries,
	defaultValues,
	variant,
	buttonClassName,
	onSuccess,
}: OfferingDialogProps) {
	return (
		<CrudDialog
			title={variant === "create" ? "お供え物を追加" : "お供え物の編集"}
			variant={variant}
			buttonClassName={buttonClassName}
			createButtonLabel="お供え物を追加"
		>
			<OfferingForm
				koudenId={koudenId}
				entries={entries}
				defaultValues={defaultValues}
				onSuccess={(offering) => {
					onSuccess?.(offering);
					close();
				}}
			/>
		</CrudDialog>
	);
}
