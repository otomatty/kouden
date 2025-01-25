"use client";

import { useAtom } from "jotai";
import { telegramDialogAtom } from "@/atoms/telegrams";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TelegramForm } from "./telegram-form";
import { Plus } from "lucide-react";
import type { Telegram } from "@/atoms/telegrams";
interface TelegramDialogProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	defaultValues?: Telegram;
	isOpen: boolean;
}

export function TelegramDialog({
	koudenId,
	koudenEntries,
	defaultValues,
	isOpen,
}: TelegramDialogProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	const [{ selectedTelegram }, setDialogState] = useAtom(telegramDialogAtom);

	const handleOpenChange = (open: boolean) => {
		setDialogState((prev) => ({ ...prev, isOpen: open }));
		if (!open) {
			setDialogState((prev) => ({ ...prev, selectedTelegram: null }));
		}
	};

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={handleOpenChange}
			title={selectedTelegram ? "弔電を編集" : "弔電を追加"}
			trigger={
				<Button
					size={isMobile ? "lg" : "default"}
					className={
						isMobile
							? "w-full mx-4 flex items-center gap-2"
							: "flex items-center gap-2"
					}
				>
					<Plus className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
					<span>弔電を追加</span>
				</Button>
			}
		>
			<TelegramForm
				koudenId={koudenId}
				koudenEntries={koudenEntries}
				isOpen={isOpen}
				onOpenChange={handleOpenChange}
				defaultValues={defaultValues}
			/>
		</ResponsiveDialog>
	);
}
