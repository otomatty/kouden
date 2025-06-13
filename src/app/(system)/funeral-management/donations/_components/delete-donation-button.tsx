"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDonation } from "@/app/_actions/funeral/donations/deleteDonation";

interface DeleteDonationButtonProps {
	donationId: string;
}

export function DeleteDonationButton({ donationId }: DeleteDonationButtonProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);

		try {
			await deleteDonation(donationId);
			toast.success("香典記録を削除しました");
			router.push("/funeral-management/donations");
			router.refresh();
		} catch (error) {
			console.error("Error deleting donation:", error);
			toast.error("削除に失敗しました");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" disabled={isDeleting}>
					<Trash2 className="h-4 w-4 mr-2" />
					削除
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>香典記録を削除しますか？</AlertDialogTitle>
					<AlertDialogDescription>
						この操作は取り消すことができません。香典記録が完全に削除されます。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? "削除中..." : "削除する"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
