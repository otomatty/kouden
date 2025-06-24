/**
 * 削除確認用の共通ダイアログコンポーネント
 *
 * @example
 * ```tsx
 * // 基本的な使用方法
 * <DeleteDialog
 *   title="項目の削除"
 *   description="この項目を削除してもよろしいですか？"
 *   targetName="削除対象の項目名"
 *   onDelete={async () => {
 *     await deleteItem(itemId);
 *   }}
 *   onSuccess={() => {
 *     // 削除成功時の処理
 *   }}
 * />
 *
 * // カスタマイズした使用方法
 * <DeleteDialog
 *   title="ユーザーの削除"
 *   description="このユーザーを削除すると、関連するデータもすべて削除されます"
 *   targetName={userName}
 *   onDelete={async () => {
 *     await deleteUser(userId);
 *   }}
 *   onSuccess={() => router.push("/users")}
 *   successMessage="ユーザーを削除しました"
 *   errorMessage="ユーザーの削除に失敗しました"
 *   buttonLabel="アカウントを削除"
 * />
 * ```
 *
 * @remarks
 * このコンポーネントは以下の機能を提供します：
 * - レスポンシブな削除確認ダイアログ
 * - 削除中の状態管理とUI表示
 * - エラーハンドリングとトースト通知
 * - キャンセル機能
 *
 * 使用する際の注意点：
 * 1. onDelete関数は必ず非同期関数として実装してください
 * 2. エラーハンドリングは内部で行われるため、onDelete内でのtry-catchは不要です
 * 3. 削除成功時の追加の処理はonSuccessコールバックで実装してください
 */

"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { toast } from "sonner";

export interface DeleteDialogProps {
	/**
	 * ダイアログのタイトル
	 * 削除対象を明確に示す文言を設定してください
	 * @example "ユーザーの削除", "香典情報の削除"
	 */
	title: string;

	/**
	 * 削除確認の説明文
	 * 削除による影響や注意事項を明確に伝える文言を設定してください
	 * @example "このユーザーを削除してもよろしいですか？"
	 * @example "この項目を削除すると、関連するデータもすべて削除されます"
	 */
	description: string;

	/**
	 * 削除対象の名前
	 * ログ出力やデバッグ用に使用されます
	 * @example userName, itemName
	 */
	targetName: string;

	/**
	 * 削除処理を行う非同期関数
	 * 実際の削除処理を実装してください
	 * エラーハンドリングは内部で行われるため、try-catchは不要です
	 * @example async () => await deleteUser(userId)
	 */
	onDelete: () => Promise<void>;

	/**
	 * 削除成功時のコールバック関数
	 * 削除成功後の追加の処理を実装してください
	 * @example () => router.push("/users")
	 * @optional
	 */
	onSuccess?: () => void;

	/**
	 * 削除成功時のメッセージ
	 * トースト通知に表示されるメッセージを設定してください
	 * @default "削除しました"
	 * @optional
	 */
	successMessage?: string;

	/**
	 * 削除失敗時のメッセージ
	 * トースト通知に表示されるエラーメッセージを設定してください
	 * @default "削除に失敗しました"
	 * @optional
	 */
	errorMessage?: string;

	/**
	 * 削除ボタンのラベル
	 * 削除ボタンに表示されるテキストを設定してください
	 * @default "削除"
	 * @optional
	 */
	buttonLabel?: string;
}

// クライアントコンポーネント
function DeleteDialogClient({
	title,
	description,
	onDelete,
	onSuccess,
	successMessage = "削除しました",
	errorMessage = "削除に失敗しました",
	buttonLabel = "削除",
}: DeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await onDelete();
			toast.success(successMessage);
			onSuccess?.();
		} catch (error) {
			console.error("Failed to delete:", error);
			toast.error("エラー", {
				description: errorMessage,
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const trigger = (
		<Button variant="destructive" className="w-full">
			<Trash2 className="h-4 w-4 mr-2" />
			{buttonLabel}
		</Button>
	);

	return (
		<ResponsiveDialog
			trigger={trigger}
			title={title}
			description={description}
			onSuccess={onSuccess}
		>
			<div className="flex justify-end gap-2 py-4">
				<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
					{isDeleting ? "削除中..." : "削除する"}
				</Button>
			</div>
		</ResponsiveDialog>
	);
}

// サーバーコンポーネントのラッパー
export function DeleteDialog(props: DeleteDialogProps) {
	return <DeleteDialogClient {...props} />;
}
