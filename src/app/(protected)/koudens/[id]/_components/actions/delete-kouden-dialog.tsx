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
import { useToast } from "@/hooks/use-toast";

interface DeleteKoudenDialogProps {
	koudenId: string;
	koudenTitle: string;
}

export function DeleteKoudenDialog({ koudenId, koudenTitle }: DeleteKoudenDialogProps) {
	const [, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmTitle, setConfirmTitle] = useState("");
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const router = useRouter();
	const { toast } = useToast();
	const handleDelete = async () => {
		if (confirmTitle !== koudenTitle) {
			return;
		}

		try {
			setIsDeleting(true);
			await deleteKouden(koudenId);
			toast({
				title: "香典帳を削除しました",
			});
			router.replace("/koudens");
		} catch (error) {
			console.error("[DeleteKoudenDialog] deleteKouden threw error:", error);
			console.error("Failed to delete kouden:", error);
			toast({
				title: "エラー",
				description: "香典帳の削除に失敗しました",
				variant: "destructive",
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
		<button
			type="button"
			className="flex flex-col items-center gap-1.5 min-w-[60px] py-2 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
		>
			<Trash2 className="h-5 w-5" />
			<span className="text-sm font-medium">香典帳を削除する</span>
		</button>
	);

	return (
		<ResponsiveDialog
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
