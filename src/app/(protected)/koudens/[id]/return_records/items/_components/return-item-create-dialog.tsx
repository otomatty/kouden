"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReturnItemForm } from "./return-item-form";
import { createReturnItem } from "@/app/_actions/return-records/return-items";
import type { ReturnItemFormData } from "@/schemas/return-items";

interface ReturnItemCreateDialogProps {
	/** ダイアログの表示状態 */
	open: boolean;
	/** ダイアログを閉じる処理 */
	onClose: () => void;
	/** 香典帳ID */
	koudenId: string;
	/** 作成成功時のコールバック */
	onSuccess?: () => void;
}

/**
 * 返礼品作成ダイアログコンポーネント
 * 役割：返礼品作成フォームをダイアログ形式で表示・処理
 */
export function ReturnItemCreateDialog({
	open,
	onClose,
	koudenId,
	onSuccess,
}: ReturnItemCreateDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 作成処理
	const handleSubmit = useCallback(
		async (formData: ReturnItemFormData) => {
			try {
				setIsSubmitting(true);

				// Server Actionに渡すデータを準備
				const createData = {
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

				await createReturnItem(createData);

				toast.success("作成完了", {
					description: "返礼品を作成しました",
				});

				onClose();
				onSuccess?.();
			} catch (error) {
				console.error("[ERROR] Failed to create return item:", error);
				toast.error("作成エラー", {
					description: error instanceof Error ? error.message : "返礼品の作成に失敗しました",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[koudenId, onClose, onSuccess],
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
					<DialogTitle>返礼品を作成</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<ReturnItemForm
						title="新しい返礼品を追加"
						submitButtonText="追加する"
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
