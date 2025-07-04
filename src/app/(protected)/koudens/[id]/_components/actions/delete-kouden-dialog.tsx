"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { deleteKouden } from "@/app/_actions/koudens";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteKoudenDialogProps {
	koudenId: string;
	koudenTitle: string;
	/** Sheetを閉じるためのコールバック関数 */
	onSheetClose?: () => void;
}

export function DeleteKoudenDialog({
	koudenId,
	koudenTitle,
	onSheetClose,
}: DeleteKoudenDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmTitle, setConfirmTitle] = useState("");
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const router = useRouter();

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (open && onSheetClose) {
			// ダイアログを開く際に親のSheetを閉じる
			onSheetClose();
		}
		if (!open) {
			// ダイアログを閉じる際に入力をリセット
			setConfirmTitle("");
		}
	};

	const handleDelete = async () => {
		if (confirmTitle !== koudenTitle) {
			return;
		}

		try {
			setIsDeleting(true);
			await deleteKouden(koudenId);
			toast.success("香典帳を削除しました", {
				description: "香典帳が正常に削除されました",
			});
			router.replace("/koudens");
		} catch (error) {
			console.error("[DeleteKoudenDialog] deleteKouden threw error:", error);
			console.error("Failed to delete kouden:", error);
			toast.error("香典帳の削除に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
			setConfirmTitle("");
		}
	};

	const isDeleteDisabled = confirmTitle !== koudenTitle || isDeleting;

	const trigger = isDesktop ? (
		<Button
			variant="ghost"
			className="flex items-center gap-2 text-destructive hover:text-destructive"
		>
			<Trash2 className="h-4 w-4" />
			<span>香典帳を削除する</span>
		</Button>
	) : (
		<Button
			variant="ghost"
			className="w-full flex items-center justify-start gap-3 h-12 text-left text-destructive hover:text-destructive"
		>
			<Trash2 className="h-5 w-5" />
			<span>香典帳を削除する</span>
		</Button>
	);

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={handleOpenChange}
			trigger={trigger}
			title="香典帳の削除"
			description="この操作は取り消せません。削除を確認するには、以下にタイトルを入力してください。"
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
					<Button variant="destructive" onClick={handleDelete} disabled={isDeleteDisabled}>
						{isDeleting ? "削除中..." : "削除する"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
}
