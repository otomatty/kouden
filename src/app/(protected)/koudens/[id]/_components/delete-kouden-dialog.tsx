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

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await onDelete(koudenId);
		} catch (error) {
			console.error("Failed to delete kouden:", error);
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
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
						「{koudenTitle}」を削除してもよろしいですか？
						<br />
						この操作は取り消せません。
					</DialogDescription>
				</DialogHeader>
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
						disabled={isDeleting}
					>
						{isDeleting ? "削除中..." : "削除する"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
