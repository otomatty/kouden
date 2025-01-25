import { useState } from "react";
import { useAtom } from "jotai";
import { filteredAndSortedTelegramsAtom } from "@/atoms/telegrams";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { useTelegrams } from "@/hooks/useTelegrams";
import { telegramsActionsAtom } from "@/atoms/telegrams";

interface TelegramBulkActionsProps {
	koudenId: string;
	selectedIds: Set<string>;
}

export function TelegramBulkActions({
	koudenId,
	selectedIds,
}: TelegramBulkActionsProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { deleteTelegram } = useTelegrams(koudenId);
	const [, dispatch] = useAtom(telegramsActionsAtom);

	const handleBulkDelete = async () => {
		try {
			for (const id of selectedIds) {
				await deleteTelegram(id);
				dispatch({ type: "delete", payload: id });
			}
			setIsDeleteDialogOpen(false);
		} catch (error) {
			console.error("弔電の一括削除に失敗しました:", error);
		}
	};

	if (selectedIds.size === 0) return null;

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">
				{selectedIds.size}件選択中
			</span>
			<Button
				variant="destructive"
				size="sm"
				onClick={() => setIsDeleteDialogOpen(true)}
			>
				<Trash2 className="h-4 w-4 mr-2" />
				選択した弔電を削除
			</Button>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>弔電を一括削除</AlertDialogTitle>
						<AlertDialogDescription>
							選択した{selectedIds.size}
							件の弔電を削除してもよろしいですか？この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							削除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
