"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

import { RelationshipForm, type RelationshipFormValues } from "./form";
import type { Relationship } from "@/types/relationships";

interface RelationshipDialogProps {
	koudenId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	relationship?: Relationship;
	onSubmit: (values: RelationshipFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

/**
 * 関係性設定のダイアログコンポーネント
 * - 新規作成/編集モードに対応
 * - フォームの状態管理
 * - エラーハンドリング
 * - レスポンシブ対応（モバイルではボトムシート、デスクトップではダイアログ）
 */
export function RelationshipDialog({
	koudenId,
	onOpenChange,
	relationship,
	onSubmit,
	isSubmitting = false,
}: RelationshipDialogProps) {
	const { toast } = useToast();
	// フォームの送信ハンドラー
	const handleSubmit = useCallback(
		async (values: RelationshipFormValues) => {
			try {
				await onSubmit(values);
				onOpenChange(false);
				toast({
					title: relationship ? "関係性を更新しました" : "関係性を作成しました",
				});
			} catch (error) {
				console.error(error);
				toast({
					title: relationship ? "関係性の更新に失敗しました" : "関係性の作成に失敗しました",
				});
			}
		},
		[onSubmit, onOpenChange, relationship, toast],
	);

	return (
		<ResponsiveDialog
			trigger={<Button>新規作成</Button>}
			title={relationship ? "関係性の編集" : "関係性の新規作成"}
			description="香典帳における故人との関係性を"
			onSuccess={() => {
				onOpenChange(false);
				toast({
					title: relationship ? "関係性を更新しました" : "関係性を作成しました",
				});
			}}
		>
			<RelationshipForm
				koudenId={koudenId}
				defaultValues={
					relationship
						? {
								name: relationship.name,
								description: relationship.description ?? undefined,
								is_default: relationship.is_default,
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
export type { RelationshipDialogProps };
