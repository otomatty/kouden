"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
	children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
	trigger: React.ReactNode;
	title?: string;
	description?: string;
	className?: string;
	contentClassName?: string;
	onSuccess?: () => void;
	/**
	 * Shortcut key to open the dialog (with Ctrl/Cmd + key).
	 */
	shortcutKey?: string;
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

export function ResponsiveDialog({
	open: openProp,
	onOpenChange,
	children,
	trigger,
	title,
	description,
	className,
	contentClassName,
	onSuccess,
	shortcutKey,
	submitForm,
	isSubmitting = false,
	submitButtonLabel = "保存",
	deleteForm,
	isDeleting = false,
	deleteButtonLabel = "削除",
}: ResponsiveDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = openProp ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;
	// クライアントサイドでのみレンダリングするかどうかを管理 (SSR対策)
	const [isClient, setIsClient] = useState(false);
	// コンポーネントがマウントされたかどうかを管理 (マウント遅延対策)
	const [isMounted, setIsMounted] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const dialogRef = useRef<HTMLDivElement>(null);

	const closeDialog = useCallback(() => {
		setOpen(false);
		onSuccess?.();
	}, [onSuccess, setOpen]);

	// DialogContentのaria-describedby警告を解消
	const dialogContentProps = {
		className: cn("sm:max-w-[425px]", contentClassName),
		"aria-describedby": description ? "dialog-description" : undefined,
		ref: dialogRef,
	};

	const renderChildren = () => {
		if (typeof children === "function") {
			return children({ close: closeDialog });
		}
		return children;
	};

	useEffect(() => {
		setIsClient(true); // コンポーネントがマウントされたらクライアントサイドとみなす

		// 少し遅延させてからマウント (レンダリングタイミング調整)
		const timer = setTimeout(() => {
			setIsMounted(true);
		}, 50); // 50ms

		return () => clearTimeout(timer);
	}, []);

	// Handle keyboard shortcut to open the dialog
	useEffect(() => {
		if (!shortcutKey) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
				e.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [shortcutKey, setOpen]);

	if (!isClient) {
		return null; // SSR では何もレンダリングしない
	}

	if (!isMounted) {
		return null; // マウントされていない場合は何もレンダリングしない
	}

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{trigger}</DialogTrigger>
				<DialogContent forceMount {...dialogContentProps}>
					{(title || description) && (
						<DialogHeader>
							{title && <DialogTitle>{title}</DialogTitle>}
							{description && (
								<DialogDescription id="dialog-description">{description}</DialogDescription>
							)}
						</DialogHeader>
					)}
					<div className={className}>{renderChildren()}</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{trigger}</DrawerTrigger>
			<DrawerContent forceMount className="flex flex-col h-[95dvh]">
				{(title || description) && (
					<DrawerHeader className="text-left flex-shrink-0">
						{title && <DrawerTitle>{title}</DrawerTitle>}
						{description && <DrawerDescription>{description}</DrawerDescription>}
					</DrawerHeader>
				)}
				<div className="flex-1 overflow-y-auto px-4 pb-4">
					<div className={className}>{renderChildren()}</div>
				</div>
				{(submitForm || deleteForm) && (
					<div className="flex-shrink-0 p-4 border-t bg-background">
						<div className="flex gap-3">
							{deleteForm && (
								<Button
									onClick={deleteForm}
									disabled={isDeleting || isSubmitting}
									variant="destructive"
									className="flex-1"
									size="lg"
								>
									{isDeleting ? "削除中..." : deleteButtonLabel}
								</Button>
							)}
							{submitForm && (
								<Button
									onClick={submitForm}
									disabled={isSubmitting || isDeleting}
									className="flex-1"
									size="lg"
								>
									{isSubmitting ? "保存中..." : submitButtonLabel}
								</Button>
							)}
						</div>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	);
}
