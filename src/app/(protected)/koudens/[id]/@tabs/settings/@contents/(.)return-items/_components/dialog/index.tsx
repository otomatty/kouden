"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ReturnItemForm, type ReturnItemFormValues } from "./form";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemDialogProps {
	koudenId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedItem?: ReturnItem;
	onSubmit: (values: ReturnItemFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

/**
 * 返礼品マスタ設定のダイアログコンポーネント
 * - 新規作成/編集モードに対応
 * - フォームの状態管理
 * - エラーハンドリング
 * - レスポンシブ対応（モバイルではボトムシート、デスクトップではダイアログ）
 */
export function ReturnItemDialog({
	koudenId,
	onOpenChange,
	selectedItem,
	onSubmit,
	isSubmitting = false,
}: ReturnItemDialogProps) {
	const { toast } = useToast();

	// フォームの送信ハンドラー
	const handleSubmit = useCallback(
		async (values: ReturnItemFormValues) => {
			try {
				await onSubmit(values);
				onOpenChange(false);
				toast({
					title: selectedItem ? "返礼品を更新しました" : "返礼品を追加しました",
				});
			} catch (error) {
				console.error(error);
				toast({
					title: selectedItem ? "返礼品の更新に失敗しました" : "返礼品の追加に失敗しました",
					description: "エラーが発生しました",
				});
			}
		},
		[onSubmit, onOpenChange, selectedItem, toast],
	);

	return (
		<ResponsiveDialog
			trigger={<Button>新規作成</Button>}
			title={selectedItem ? "返礼品の編集" : "返礼品の追加"}
			description="香典返しで使用する返礼品を設定します"
			onSuccess={() => {
				onOpenChange(false);
				toast({
					title: selectedItem ? "返礼品を更新しました" : "返礼品を追加しました",
				});
			}}
		>
			<ReturnItemForm
				koudenId={koudenId}
				defaultValues={
					selectedItem
						? {
								name: selectedItem.name,
								description: selectedItem.description ?? undefined,
								price: selectedItem.price,
							}
						: undefined
				}
				onSubmit={handleSubmit}
				onCancel={() => onOpenChange(false)}
				isSubmitting={isSubmitting}
			/>
		</ResponsiveDialog>
	);
}

// 型定義のエクスポート
export type { ReturnItemDialogProps };
