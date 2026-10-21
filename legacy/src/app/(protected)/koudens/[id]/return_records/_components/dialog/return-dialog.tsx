"use client";

// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// components
import { CrudDialog } from "@/components/custom/crud-dialog";
import { ReturnForm } from "./return-form";

export interface ReturnDialogProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
	defaultValues: ReturnManagementSummary; // 必須に変更（編集のみなので）
	variant?: "edit" | undefined; // createを削除
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSuccess?: (returnRecord: ReturnManagementSummary) => void;
	trigger?: React.ReactNode;
	/**
	 * Shortcut key to open the dialog (with Ctrl/Cmd + key).
	 */
	shortcutKey?: string;
}

/**
 * ReturnDialogコンポーネント
 * 役割：返礼管理のダイアログ（編集専用）
 * 返礼情報は既存の香典エントリーに対してのみ編集可能
 * CrudDialogを使用して統一されたUI/UXを提供
 */
export function ReturnDialog({
	koudenId,
	entries,
	relationships,
	defaultValues,
	variant = "edit", // デフォルトを編集に
	open,
	onOpenChange,
	onSuccess,
	trigger,
	shortcutKey,
}: ReturnDialogProps) {
	return (
		<CrudDialog<ReturnManagementSummary>
			open={open}
			onOpenChange={onOpenChange}
			title="返礼情報を編集する"
			variant={variant}
			shortcutKey={shortcutKey}
			editButtonLabel="編集する"
			onSuccess={onSuccess}
			trigger={trigger}
			contentClassName="max-w-4xl" // 返礼品管理は複雑なので幅を広く
		>
			{({ close }) => (
				<ReturnForm
					koudenId={koudenId}
					entries={entries}
					relationships={relationships}
					defaultValues={defaultValues}
					onSuccess={(returnRecord) => {
						onSuccess?.(returnRecord);
						close();
					}}
					onCancel={close}
				/>
			)}
		</CrudDialog>
	);
}
