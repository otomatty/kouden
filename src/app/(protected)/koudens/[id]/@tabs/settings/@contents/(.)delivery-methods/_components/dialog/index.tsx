"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

import { DeliveryMethodForm, type DeliveryMethodFormValues } from "./form";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";

interface DeliveryMethodDialogProps {
	koudenId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deliveryMethod?: DeliveryMethod;
	onSubmit: (values: DeliveryMethodFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

/**
 * 配送方法設定のダイアログコンポーネント
 * - 新規作成/編集モードに対応
 * - フォームの状態管理
 * - エラーハンドリング
 * - レスポンシブ対応（モバイルではボトムシート、デスクトップではダイアログ）
 */
export function DeliveryMethodDialog({
	koudenId,
	onOpenChange,
	deliveryMethod,
	onSubmit,
	isSubmitting = false,
}: DeliveryMethodDialogProps) {
	const { toast } = useToast();
	// フォームの送信ハンドラー
	const handleSubmit = useCallback(
		async (values: DeliveryMethodFormValues) => {
			try {
				await onSubmit(values);
				onOpenChange(false);
				toast({
					title: deliveryMethod ? "配送方法を更新しました" : "配送方法を作成しました",
				});
			} catch (error) {
				console.error(error);
				toast({
					title: deliveryMethod ? "配送方法の更新に失敗しました" : "配送方法の作成に失敗しました",
				});
			}
		},
		[onSubmit, onOpenChange, deliveryMethod, toast],
	);

	return (
		<ResponsiveDialog
			trigger={<Button>新規作成</Button>}
			title={deliveryMethod ? "配送方法の編集" : "配送方法の新規作成"}
			description="返礼品の配送方法を設定します"
			onSuccess={() => {
				onOpenChange(false);
				toast({
					title: deliveryMethod ? "配送方法を更新しました" : "配送方法を作成しました",
				});
			}}
		>
			<DeliveryMethodForm
				koudenId={koudenId}
				defaultValues={
					deliveryMethod
						? {
								name: deliveryMethod.name,
								description: deliveryMethod.description ?? undefined,
							}
						: undefined
				}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
			/>
		</ResponsiveDialog>
	);
}

// 型定義のエクスポート
export type { DeliveryMethodDialogProps };
