/**
 * CRUDダイアログコンポーネント
 *
 * 作成・編集フォームを表示するための汎用的なダイアログコンポーネントです。
 * フォームの内容はchildrenとして渡し、ダイアログの表示制御や権限管理などの共通機能を提供します。
 *
 * @example
 * // 基本的な使用方法
 * <CrudDialog<UserData>
 *   title="ユーザー情報"
 *   variant="create"
 *   canCreate={hasCreatePermission}
 *   createButtonLabel="ユーザーを追加"
 * >
 *   <UserForm onSubmit={handleSubmit} />
 * </CrudDialog>
 *
 * @example
 * // 外部からの制御
 * <CrudDialog<UserData>
 *   title="ユーザー情報の編集"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * >
 *   <UserForm onSubmit={handleSubmit} />
 * </CrudDialog>
 *
 * @example
 * // テーブルの行編集での使用例
 * const columns = [
 *   {
 *     id: "actions",
 *     cell: ({ row }) => (
 *       <CrudDialog<UserData>
 *         title="ユーザー情報の編集"
 *         variant="edit"
 *         defaultValues={row.original}
 *       >
 *         <UserForm defaultValues={row.original} />
 *       </CrudDialog>
 *     ),
 *   },
 * ];
 */

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CrudDialogProps<T> {
	/**
	 * ダイアログのタイトル
	 * variant に応じて動的に変更することも可能です
	 */
	title: string;

	/**
	 * ダイアログの表示モード
	 * - "create": 作成モード（プラスアイコンのボタンが表示されます）
	 * - "edit": 編集モード（編集アイコンのボタンが表示されます）
	 * - undefined: ボタンが表示されず、open/onOpenChangeで外部から制御します
	 */
	variant?: "create" | "edit";

	/**
	 * トリガーボタンのクラス名
	 * variant が指定されている場合のみ有効です
	 */
	buttonClassName?: string;

	/**
	 * ダイアログコンテンツのクラス名
	 * @default "max-w-2xl"
	 */
	contentClassName?: string;

	/**
	 * ダイアログの表示状態
	 * 外部から制御する場合に使用します
	 */
	open?: boolean;

	/**
	 * ダイアログの表示状態が変更された時のコールバック
	 * 外部から制御する場合に使用します
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * 作成権限があるかどうか
	 * variant="create" の場合に使用されます
	 * @default true
	 */
	canCreate?: boolean;

	/**
	 * 編集権限があるかどうか
	 * variant="edit" の場合に使用されます
	 * @default true
	 */
	canUpdate?: boolean;

	/**
	 * 作成ボタンのラベル
	 * variant="create" の場合に使用されます
	 * @default "新規登録"
	 */
	createButtonLabel?: string;

	/**
	 * 編集ボタンのラベル
	 * variant="edit" の場合に使用されます
	 * @default "編集"
	 */
	editButtonLabel?: string;

	/**
	 * ダイアログの中身となるフォームコンポーネント
	 */
	children: React.ReactNode;
}

export function CrudDialog<T>({
	title,
	variant,
	buttonClassName,
	contentClassName = "max-w-2xl",
	open,
	onOpenChange,
	canCreate = true,
	canUpdate = true,
	createButtonLabel = "新規登録",
	editButtonLabel = "編集",
	children,
}: CrudDialogProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const isMobile = useMediaQuery("(max-width: 768px)");

	// パーミッションチェック
	if (
		(variant === "create" && !canCreate) ||
		(variant === "edit" && !canUpdate)
	) {
		return null;
	}

	// ボタンのスタイルとコンテンツを設定
	const buttonSize = isMobile ? "lg" : "default";
	const buttonContent =
		variant === "create" ? (
			<>
				<Plus className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
				<span>{createButtonLabel}</span>
			</>
		) : (
			<>
				<Pencil className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
				<span>{editButtonLabel}</span>
			</>
		);

	const defaultButtonClassName =
		variant === "create"
			? isMobile
				? "w-full mx-4 flex items-center gap-2"
				: "flex items-center gap-2"
			: "flex items-center gap-2";

	const handleOpenChange = (newOpen: boolean) => {
		if (onOpenChange) {
			onOpenChange(newOpen);
		} else {
			setIsOpen(newOpen);
		}
	};

	return (
		<ResponsiveDialog
			open={open ?? isOpen}
			onOpenChange={handleOpenChange}
			trigger={
				variant ? (
					<Button
						size={buttonSize}
						variant="default"
						className={buttonClassName || defaultButtonClassName}
					>
						{buttonContent}
					</Button>
				) : null
			}
			title={title}
			contentClassName={contentClassName}
		>
			{children}
		</ResponsiveDialog>
	);
}
