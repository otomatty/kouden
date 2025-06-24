"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReturnItemForm } from "./return-item-form";
import { updateReturnItem } from "@/app/_actions/return-records/return-items";
import type { ReturnItem } from "@/types/return-records/return-items";
import type { ReturnItemFormData } from "@/schemas/return-items";

interface ReturnItemEditDialogProps {
	/** ダイアログの表示状態 */
	open: boolean;
	/** ダイアログを閉じる処理 */
	onClose: () => void;
	/** 編集対象の返礼品データ */
	returnItem: ReturnItem;
	/** 香典帳ID */
	koudenId: string;
	/** 編集成功時のコールバック */
	onSuccess?: () => void;
}

/**
 * 返礼品編集ダイアログコンポーネント
 * 役割：返礼品編集フォームをダイアログ形式で表示・処理
 */
export function ReturnItemEditDialog({
	open,
	onClose,
	returnItem,
	koudenId,
	onSuccess,
}: ReturnItemEditDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 編集処理
	const handleSubmit = useCallback(
		async (formData: ReturnItemFormData) => {
			try {
				setIsSubmitting(true);

				// Server Actionに渡すデータを準備
				const updateData = {
					id: returnItem.id,
					name: formData.name,
					description: formData.description || null,
					price: formData.price,
					kouden_id: koudenId,
					category: formData.category,
					image_url: formData.image_url || null,
					is_active: formData.is_active,
					sort_order: formData.sort_order,
					recommended_amount_min: formData.recommended_amount_min,
					recommended_amount_max: formData.recommended_amount_max,
				};

				await updateReturnItem(updateData);

				toast.success("更新完了", {
					description: "返礼品を更新しました",
				});

				onClose();
				onSuccess?.();
			} catch (error) {
				console.error("[ERROR] Failed to update return item:", error);
				toast.error("更新エラー", {
					description: error instanceof Error ? error.message : "返礼品の更新に失敗しました",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[returnItem.id, koudenId, onClose, onSuccess],
	);

	// キャンセル処理
	const handleCancel = useCallback(() => {
		if (!isSubmitting) {
			onClose();
		}
	}, [isSubmitting, onClose]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>返礼品を編集</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<ReturnItemForm
						initialData={returnItem}
						title={`「${returnItem.name}」の情報を編集`}
						submitButtonText="更新する"
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isSubmitting={isSubmitting}
						koudenId={koudenId}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
