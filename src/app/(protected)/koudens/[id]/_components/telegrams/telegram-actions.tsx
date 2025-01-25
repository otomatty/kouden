"use client";

import { useAtom } from "jotai";
import { telegramDialogAtom, telegramsActionsAtom } from "@/atoms/telegrams";
import { useTelegrams } from "@/hooks/useTelegrams";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import type { Telegram } from "@/atoms/telegrams";

interface TelegramActionsProps {
	telegram: Telegram;
	koudenId: string;
}

export function TelegramActions({ telegram, koudenId }: TelegramActionsProps) {
	const [, setDialogState] = useAtom(telegramDialogAtom);
	const [, dispatch] = useAtom(telegramsActionsAtom);
	const { deleteTelegram } = useTelegrams(koudenId);

	const handleEdit = () => {
		setDialogState({
			isOpen: true,
			selectedTelegram: telegram,
		});
	};

	const handleDelete = async () => {
		try {
			await deleteTelegram(telegram.id);
			dispatch({ type: "delete", payload: telegram.id });
		} catch (error) {
			console.error("弔電の削除に失敗しました:", error);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={handleEdit}>
					<Edit2 className="mr-2 h-4 w-4" />
					編集
				</DropdownMenuItem>
				<DropdownMenuItem className="text-destructive" onClick={handleDelete}>
					<Trash2 className="mr-2 h-4 w-4" />
					削除
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
