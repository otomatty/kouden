"use client";

import { useState, useCallback, useEffect } from "react";
import { useAtomValue, useAtom } from "jotai";
import { toast } from "sonner";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { CrudDialog } from "@/components/custom/crud-dialog";
import { EntryForm } from "./entry-form";
import { formSubmissionStateAtom, entriesAtom } from "@/store/entries";
import { deleteEntry } from "@/app/_actions/entries";

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
	const [submitForm, setSubmitForm] = useState<(() => void) | null>(null);
	const [deleteForm, setDeleteForm] = useState<(() => void) | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const submissionState = useAtomValue(formSubmissionStateAtom);
	const [entries, setEntries] = useAtom(entriesAtom);

	const handleFormReady = useCallback((submitFn: () => void) => {
		setSubmitForm(() => submitFn);
	}, []);

	const handleDelete = useCallback(async () => {
		if (!defaultValues) return;

		try {
			setIsDeleting(true);
			await deleteEntry(defaultValues.id, koudenId);

			// エントリーリストから削除
			setEntries(entries.filter((e) => e.id !== defaultValues.id));

			toast.success("香典情報を削除しました", {
				description: `${defaultValues.name || "名称未設定"}を削除しました`,
			});

			// ダイアログを閉じる
			onOpenChange?.(false);
			onSuccess?.(defaultValues);
		} catch (error) {
			console.error("Failed to delete entry:", error);
			toast.error("削除に失敗しました", {
				description:
					error instanceof Error ? error.message : "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsDeleting(false);
		}
	}, [defaultValues, koudenId, entries, setEntries, onOpenChange, onSuccess]);

	// 削除機能を設定（編集モードの場合のみ）
	useEffect(() => {
		if (variant === "edit" && defaultValues) {
			setDeleteForm(() => handleDelete);
		} else {
			setDeleteForm(null);
		}
	}, [variant, defaultValues, handleDelete]);

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
			submitForm={submitForm}
			isSubmitting={submissionState.isSubmitting}
			submitButtonLabel={defaultValues ? "更新" : "追加"}
			deleteForm={deleteForm}
			isDeleting={isDeleting}
			deleteButtonLabel="削除"
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
					onFormReady={handleFormReady}
				/>
			)}
		</CrudDialog>
	);
}
