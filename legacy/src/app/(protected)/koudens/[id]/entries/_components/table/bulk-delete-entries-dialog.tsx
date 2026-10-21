import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface BulkDeleteEntriesDialogProps {
	selectedCount: number;
	onConfirm: () => void;
}

export function BulkDeleteEntriesDialog({
	selectedCount,
	onConfirm,
}: BulkDeleteEntriesDialogProps) {
	if (selectedCount === 0) {
		return null;
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm" className="flex items-center gap-2">
					<Trash2 className="h-4 w-4" />
					<span>{selectedCount}件を削除</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>削除の確認</AlertDialogTitle>
					<AlertDialogDescription>
						選択された{selectedCount}件のデータを削除します。
						この操作は元に戻すことができません。 本当に削除してよろしいですか？
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						削除する
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
