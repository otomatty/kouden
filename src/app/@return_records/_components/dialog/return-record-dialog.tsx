"use client";

import type { ReturnRecord } from "@/types/return-records";
import type { DeliveryMethod } from "@/types/delivery-methods";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import { CrudDialog } from "@/components/custom/crud-dialog";
import { ReturnRecordForm } from "./return-record-form";
import type { Entry } from "@/types/entries";

export interface ReturnRecordDialogProps {
	koudenId: string;
	entries: Entry[];
	deliveryMethods: DeliveryMethod[];
	returnItemMasters: ReturnItemMaster[];
	defaultValues?: ReturnRecord;
	variant?: "create" | "edit" | undefined; // undefinedはボタンが表示されないことを表す
	onSuccess?: (returnRecord: ReturnRecord) => void;
}

/**
 * 返礼情報の登録・編集ダイアログ
 * @param koudenId - 香典ID
 * @param deliveryMethods - 配送方法の一覧
 * @param returnItemMasters - 返礼品マスターの一覧
 * @param defaultValues - 編集時の初期値
 * @param variant - ダイアログの種類（create: 新規作成, edit: 編集, undefined: ボタン非表示）
 * @param onSuccess - 登録・編集成功時のコールバック
 */
export function ReturnRecordDialog({
	koudenId,
	entries,
	deliveryMethods,
	returnItemMasters,
	defaultValues,
	variant,
	onSuccess,
}: ReturnRecordDialogProps) {
	return (
		<CrudDialog<ReturnRecord>
			title={variant === "create" ? "返礼情報を登録する" : "編集する"}
			variant={variant}
			createButtonLabel="返礼情報を登録する"
			editButtonLabel="編集する"
			onSuccess={onSuccess}
		>
			{({ close }) => (
				<ReturnRecordForm
					koudenId={koudenId}
					entries={entries}
					deliveryMethods={deliveryMethods}
					returnItemMasters={returnItemMasters}
					defaultValues={defaultValues}
					onSuccess={(returnRecord) => {
						onSuccess?.(returnRecord);
						close();
					}}
				/>
			)}
		</CrudDialog>
	);
}
