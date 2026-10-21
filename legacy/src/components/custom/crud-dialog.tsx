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

import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import type React from "react";
import { useState, useEffect } from "react";
import "@/types/navigator";

export interface CrudDialogProps<T = void> {
	/**
	 * ダイアログのタイトル
	 * variant に応じて動的に変更することも可能です
	 * @example
	 * title={variant === "create" ? "新規香典記録" : "香典記録の編集"}
	 * この際、variant が undefined の場合は title は無視されます
	 */
	title: string;

	/**
	 * Shortcut key to open the dialog (with Ctrl/Cmd + key).
	 */
	shortcutKey?: string;

	/**
	 * ダイアログの表示モード
	 * - "create": 作成モード（プラスアイコンのボタンが表示されます）
	 * - "edit": 編集モード（編集アイコンのボタンが表示されます）
	 * - undefined: ボタンが表示されず、open/onOpenChangeで外部から制御します
	 */
	variant: "create" | "edit" | undefined;

	/**
	 * トリガーボタンのクラス名
	 * variant が指定されている場合のみ有効です
	 */
	buttonClassName?: string;

	/**
	 * カスタムトリガー要素
	 * 指定された場合、デフォルトのトリガーボタンの代わりに使用されます
	 */
	trigger?: React.ReactNode;

	/**
	 * ダイアログコンテンツのクラス名
	 * @default "max-w-2xl"
	 */
	contentClassName?: string;

	/**
	 * 編集ボタンのラベル
	 * variant="edit" の場合に使用されます
	 * @default "編集"
	 */
	editButtonLabel?: string;

	/**
	 * 作成ボタンのラベル
	 * variant="create" の場合に使用されます
	 * @default "新規登録"
	 */
	createButtonLabel?: string;

	/**
	 * ダイアログの中身となるフォームコンポーネント
	 */
	children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);

	/**
	 * 成功時のコールバック
	 */
	onSuccess?: (data: T) => void;

	/** Controlled open state */
	open?: boolean;

	/** Controlled onOpenChange callback */
	onOpenChange?: (open: boolean) => void;

	/**
	 * フォーム送信関数
	 * モバイルでの固定ボタンから呼び出されます
	 */
	submitForm?: (() => void) | null;

	/**
	 * 送信中状態
	 */
	isSubmitting?: boolean;

	/**
	 * 送信ボタンのラベル
	 */
	submitButtonLabel?: string;

	/**
	 * 削除関数
	 * モバイルでの固定ボタンから呼び出されます
	 */
	deleteForm?: (() => void) | null;

	/**
	 * 削除中状態
	 */
	isDeleting?: boolean;

	/**
	 * 削除ボタンのラベル
	 */
	deleteButtonLabel?: string;
}

export function CrudDialog<T = void>({
	open,
	onOpenChange,
	title,
	variant,
	buttonClassName,
	contentClassName = "max-w-2xl",
	createButtonLabel = "新規登録",
	editButtonLabel = "編集",
	trigger: customTrigger,
	children,
	onSuccess,
	shortcutKey,
	submitForm,
	isSubmitting = false,
	submitButtonLabel = "保存",
	deleteForm,
	isDeleting = false,
	deleteButtonLabel = "削除",
}: CrudDialogProps<T>) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [isMac, setIsMac] = useState(false);
	useEffect(() => {
		const platform = navigator.userAgentData?.platform || navigator.userAgent;
		setIsMac(/Mac|iPhone|iPod|iPad/i.test(platform));
	}, []);

	// ボタンのスタイルとコンテンツを設定
	const buttonSize = isMobile ? "lg" : "default";

	// ボタンの内容を設定（アイコンとラベル）
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

	// ボタンのスタイルを設定
	// モバイル時：
	// - 作成ボタン：全幅で中央寄せ
	// - 編集ボタン：通常の幅
	// デスクトップ時：
	// - 作成ボタン：defaultバリアントで強調表示
	// - 編集ボタン：ghostバリアントでドロップダウンメニューのような見た目
	const defaultButtonClassName =
		variant === "create"
			? isMobile // モバイル
				? "w-full mx-4 flex items-center gap-2" // 作成ボタン
				: "flex items-center gap-2" // 編集ボタン
			: isMobile //デスクトップ
				? "flex items-center gap-2" // 作成ボタン
				: "w-full relative flex cursor-default select-none justify-start items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0"; // 編集ボタン

	const shortcutLabel = shortcutKey
		? isMac
			? `⌘+${shortcutKey.toUpperCase()}`
			: `Ctrl+${shortcutKey.toUpperCase()}`
		: "";

	// デフォルトのトリガーボタン
	const defaultTrigger = variant ? (
		<Button
			size={buttonSize}
			variant={isMobile ? "default" : variant === "create" ? "default" : "ghost"}
			className={buttonClassName || defaultButtonClassName}
			aria-keyshortcuts={shortcutKey ? `${isMac ? "meta" : "ctrl"}+${shortcutKey}` : undefined}
		>
			{buttonContent}
			{!isMobile && shortcutKey && (
				<Badge variant="outline" className="bg-muted text-muted-foreground">
					{shortcutLabel}
				</Badge>
			)}
		</Button>
	) : null;

	// if customTrigger prop is provided (even null), use it; otherwise use defaultTrigger
	const triggerNode = customTrigger !== undefined ? customTrigger : defaultTrigger;
	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={onOpenChange}
			trigger={triggerNode}
			title={title}
			contentClassName={contentClassName}
			onSuccess={onSuccess ? () => onSuccess({} as T) : undefined}
			shortcutKey={shortcutKey}
			submitForm={submitForm}
			isSubmitting={isSubmitting}
			submitButtonLabel={submitButtonLabel}
			deleteForm={deleteForm}
			isDeleting={isDeleting}
			deleteButtonLabel={deleteButtonLabel}
		>
			{children}
		</ResponsiveDialog>
	);
}
