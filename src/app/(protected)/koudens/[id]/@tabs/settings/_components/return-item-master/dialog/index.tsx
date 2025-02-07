"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ReturnItemMasterForm, type ReturnItemMasterFormValues } from "./form";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

interface ReturnItemMasterDialogProps {
	koudenId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedItem?: ReturnItemMaster;
	onSubmit: (values: ReturnItemMasterFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

/**
 * 返礼品マスタ設定のダイアログコンポーネント
 * - 新規作成/編集モードに対応
 * - フォームの状態管理
 * - エラーハンドリング
 * - レスポンシブ対応（モバイルではボトムシート、デスクトップではダイアログ）
 */
export function ReturnItemMasterDialog({
	koudenId,
	onOpenChange,
	selectedItem,
	onSubmit,
	isSubmitting = false,
}: ReturnItemMasterDialogProps) {
	const { toast } = useToast();

	// フォームの送信ハンドラー
	const handleSubmit = useCallback(
		async (values: ReturnItemMasterFormValues) => {
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
			<ReturnItemMasterForm
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
export type { ReturnItemMasterDialogProps };
