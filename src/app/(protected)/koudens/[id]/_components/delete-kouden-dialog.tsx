import { Trash2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) {
					setConfirmTitle("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="destructive"
					size="sm"
					className="flex items-center gap-2"
				>
					<Trash2 className="h-4 w-4" />
					<span>削除</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>香典帳の削除</DialogTitle>
					<DialogDescription>
						この操作は取り消せません。削除を確認するには、以下にタイトルを入力してください。
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>タイトル: {koudenTitle}</Label>
						<Input
							value={confirmTitle}
							onChange={(e) => setConfirmTitle(e.target.value)}
							placeholder="タイトルを入力して削除を確認"
						/>
					</div>
				</div>
				<DialogFooter>
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
						disabled={isDeleteDisabled}
					>
						{isDeleting ? "削除中..." : "削除する"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
