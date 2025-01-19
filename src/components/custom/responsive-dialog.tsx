"use client";

import * as React from "react";
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
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
	children: React.ReactNode;
	trigger: React.ReactNode;
	title?: string;
	description?: string;
	className?: string;
	contentClassName?: string;
	showCloseButton?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ResponsiveDialog({
	children,
	trigger,
	title,
	description,
	className,
	contentClassName,
	showCloseButton = false,
	open,
	onOpenChange,
}: ResponsiveDialogProps) {
	const [_open, _setOpen] = React.useState(false);
	const isControlled = open !== undefined;
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleOpenChange = (value: boolean) => {
		if (!isControlled) {
			_setOpen(value);
		}
		onOpenChange?.(value);
	};

	const currentOpen = isControlled ? open : _open;

	if (isDesktop) {
		return (
			<Dialog open={currentOpen} onOpenChange={handleOpenChange}>
				<DialogTrigger asChild>{trigger}</DialogTrigger>
				<DialogContent className={cn("sm:max-w-[425px]", contentClassName)}>
					{(title || description) && (
						<DialogHeader>
							{title && <DialogTitle>{title}</DialogTitle>}
							{description && (
								<DialogDescription>{description}</DialogDescription>
							)}
						</DialogHeader>
					)}
					<div className={className}>{children}</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={currentOpen} onOpenChange={handleOpenChange}>
			<DrawerTrigger asChild>{trigger}</DrawerTrigger>
			<DrawerContent>
				{(title || description) && (
					<DrawerHeader className="text-left">
						{title && <DrawerTitle>{title}</DrawerTitle>}
						{description && (
							<DrawerDescription>{description}</DrawerDescription>
						)}
					</DrawerHeader>
				)}
				<div className={cn("px-4", className)}>{children}</div>
				{showCloseButton && (
					<DrawerFooter className="pt-2">
						<DrawerClose asChild>
							<button
								type="button"
								className="w-full h-12 bg-background text-foreground border rounded-md hover:bg-accent hover:text-accent-foreground"
							>
								閉じる
							</button>
						</DrawerClose>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
}
