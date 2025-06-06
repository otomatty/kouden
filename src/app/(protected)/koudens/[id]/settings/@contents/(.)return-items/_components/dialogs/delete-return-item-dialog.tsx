"use client";

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
import { useToast } from "@/hooks/use-toast";
import type { ReturnItem } from "@/types/return-records";
import { deleteReturnItem } from "@/app/_actions/return-records/return-items";

interface DeleteReturnItemDialogProps {
	koudenId: string;
	returnItem: ReturnItem | null;
	onClose: () => void;
}

/**
 * 返礼品削除確認ダイアログ
 * - 返礼品の削除前に確認を行う
 */
export function DeleteReturnItemDialog({
	koudenId,
	returnItem,
	onClose,
}: DeleteReturnItemDialogProps) {
	const { toast } = useToast();

	const handleDelete = async () => {
		if (!returnItem) return;

		try {
			await deleteReturnItem(koudenId, returnItem.id);
			toast({
				title: "返礼品を削除しました",
				description: `${returnItem.name}を削除しました。`,
			});
			onClose();
		} catch (error) {
			console.error("Failed to delete return item:", error);
			toast({
				title: "エラーが発生しました",
				description: error instanceof Error ? error.message : "返礼品の削除に失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<AlertDialog open={!!returnItem} onOpenChange={() => onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>返礼品を削除</AlertDialogTitle>
					<AlertDialogDescription>
						{returnItem?.name}
						を削除してもよろしいですか？この操作は取り消せません。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onClose()}>キャンセル</AlertDialogCancel>
					<AlertDialogAction onClick={handleDelete} className="bg-destructive">
						削除
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// 型定義のエクスポート
export type { DeleteReturnItemDialogProps };
