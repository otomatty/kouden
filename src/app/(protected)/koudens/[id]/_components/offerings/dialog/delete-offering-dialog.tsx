"use client";

import { DeleteDialog } from "@/components/custom/delete-dialog";
import { deleteOffering } from "@/app/_actions/offerings";

// お供物情報を削除するためのダイアログ

interface DeleteOfferingDialogProps {
	koudenId: string;
	offeringId: string;
	offeringName: string;
	onSuccess?: () => void;
}

export function DeleteOfferingDialog({
	koudenId,
	offeringId,
	offeringName,
	onSuccess,
}: DeleteOfferingDialogProps) {
	return (
		<DeleteDialog
			title="お供物情報の削除"
			description={`${offeringName}を削除してもよろしいですか？`}
			targetName={offeringName}
			onDelete={async () => {
				await deleteOffering(offeringId, koudenId);
			}}
			onSuccess={onSuccess}
			successMessage="お供物情報を削除しました"
			errorMessage="お供物情報の削除に失敗しました"
			buttonLabel="削除"
		/>
	);
}
