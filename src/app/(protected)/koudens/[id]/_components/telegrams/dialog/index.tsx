"use client";

import { useAtom } from "jotai";
import { telegramStateAtom, telegramActionsAtom } from "@/store/telegrams";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TelegramForm } from "./telegram-form";
import { Plus } from "lucide-react";

interface TelegramDialogProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function TelegramDialog({
	koudenId,
	koudenEntries,
}: TelegramDialogProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [state] = useAtom(telegramStateAtom);
	const [, dispatch] = useAtom(telegramActionsAtom);

	const { create: createDialog, edit: editDialog } = state.dialogs;
	const isOpen = createDialog.isOpen || editDialog.isOpen;
	const defaultValues =
		editDialog.selectedTelegram || createDialog.defaultValues;

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			// ダイアログを閉じる時は両方のダイアログ状態をリセット
			dispatch({
				type: "setDialog",
				payload: {
					dialog: "create",
					props: { isOpen: false, defaultValues: null },
				},
			});
			dispatch({
				type: "setDialog",
				payload: {
					dialog: "edit",
					props: { isOpen: false, selectedTelegram: null },
				},
			});
		}
	};

	const handleCreate = () => {
		dispatch({
			type: "setDialog",
			payload: {
				dialog: "create",
				props: { isOpen: true, defaultValues: null },
			},
		});
	};

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={handleOpenChange}
			trigger={
				<Button
					size={isMobile ? "lg" : "default"}
					className={
						isMobile
							? "w-full mx-4 flex items-center gap-2"
							: "flex items-center gap-2"
					}
					onClick={handleCreate}
				>
					<Plus className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
					<span>弔電を追加</span>
				</Button>
			}
			title={defaultValues ? "弔電を編集" : "弔電を追加"}
		>
			<TelegramForm
				koudenId={koudenId}
				koudenEntries={koudenEntries}
				defaultValues={defaultValues}
			/>
		</ResponsiveDialog>
	);
}
