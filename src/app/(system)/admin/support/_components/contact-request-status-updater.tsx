"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateContactRequestStatus } from "@/app/_actions/admin/contact-requests";
import { Loader2 } from "lucide-react";

interface ContactRequestStatusUpdaterProps {
	requestId: string;
	currentStatus: string;
}

const statusOptions = [
	{ value: "new", label: "新規" },
	{ value: "in_progress", label: "対応中" },
	{ value: "closed", label: "完了" },
];

export function ContactRequestStatusUpdater({
	requestId,
	currentStatus,
}: ContactRequestStatusUpdaterProps) {
	const [status, setStatus] = useState(currentStatus);
	const [isUpdating, setIsUpdating] = useState(false);

	const router = useRouter();

	const handleStatusUpdate = async (newStatus: string) => {
		if (newStatus === status) return;

		setIsUpdating(true);
		try {
			await updateContactRequestStatus(requestId, newStatus as "new" | "in_progress" | "closed");

			setStatus(newStatus);
			toast.success("ステータスを更新しました", {
				description: `ステータスを「${statusOptions.find((opt) => opt.value === newStatus)?.label}」に変更しました。`,
			});

			// ページを再読み込みして最新の状態を反映
			router.refresh();
		} catch (error) {
			console.error("Failed to update status:", error);
			toast.error("ステータスの更新に失敗しました", {
				description: "しばらく時間をおいて再度お試しください。",
			});
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium text-gray-700">ステータス:</span>
			<Select value={status} onValueChange={handleStatusUpdate} disabled={isUpdating}>
				<SelectTrigger className="w-[140px]">
					{isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{statusOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
