"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

interface DeleteKoudenDialogProps {
	koudenId: string;
	koudenTitle: string;
	onDelete: (id: string) => Promise<void>;
}

export function DeleteKoudenDialog({
	koudenId,
	koudenTitle,
	onDelete,
}: DeleteKoudenDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmTitle, setConfirmTitle] = useState("");
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleDelete = async () => {
		if (confirmTitle !== koudenTitle) {
			return;
		}

		try {
			setIsDeleting(true);
			await onDelete(koudenId);
		} catch (error) {
			console.error("Failed to delete kouden:", error);
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
			setConfirmTitle("");
		}
	};

	const isDeleteDisabled = confirmTitle !== koudenTitle || isDeleting;

	const trigger = isDesktop ? (
		<Button variant="destructive" size="sm" className="flex items-center gap-2">
			<Trash2 className="h-4 w-4" />
			<span>削除</span>
		</Button>
	) : (
		<button
			type="button"
			className="flex flex-col items-center gap-1.5 min-w-[72px] py-2 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
		>
			<Trash2 className="h-5 w-5" />
			<span className="text-xs font-medium">削除</span>
		</button>
	);

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) {
					setConfirmTitle("");
				}
			}}
			trigger={trigger}
			title="香典帳の削除"
			description="この操作は取り消せません。削除を確認するには、以下にタイトルを入力してください。"
			showCloseButton
		>
			<div className="space-y-4 py-4">
				<div className="space-y-2">
					<Label>タイトル: {koudenTitle}</Label>
					<Input
						value={confirmTitle}
						onChange={(e) => setConfirmTitle(e.target.value)}
						placeholder="タイトルを入力して削除を確認"
					/>
				</div>
				<div className="flex justify-end gap-2">
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleteDisabled}
					>
						{isDeleting ? "削除中..." : "削除する"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
}
