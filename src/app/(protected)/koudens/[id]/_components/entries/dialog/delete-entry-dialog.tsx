"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { deleteKoudenEntry } from "@/app/_actions/kouden-entries";
import { toast } from "@/hooks/use-toast";

interface DeleteEntryDialogProps {
	koudenId: string;
	entryId: string;
	entryName: string;
	onSuccess?: () => void;
}

export function DeleteEntryDialog({
	koudenId,
	entryId,
	entryName,
	onSuccess,
}: DeleteEntryDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await deleteKoudenEntry(entryId, koudenId);
			toast({
				title: "香典情報を削除しました",
			});
			onSuccess?.();
		} catch (error) {
			console.error("Failed to delete entry:", error);
			toast({
				title: "エラー",
				description: "香典情報の削除に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
		}
	};

	const trigger = (
		<Button
			variant="destructive"
			className="w-full"
			onClick={() => setIsOpen(true)}
		>
			<Trash2 className="h-4 w-4 mr-2" />
			削除
		</Button>
	);

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={trigger}
			title="香典情報の削除"
			description={`${entryName}を削除してもよろしいですか？`}
			showCloseButton
		>
			<div className="flex justify-end gap-2 py-4">
				<Button
					variant="outline"
					onClick={() => setIsOpen(false)}
					disabled={isDeleting}
				>
					キャンセル
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={isDeleting}
				>
					{isDeleting ? "削除中..." : "削除する"}
				</Button>
			</div>
		</ResponsiveDialog>
	);
}
