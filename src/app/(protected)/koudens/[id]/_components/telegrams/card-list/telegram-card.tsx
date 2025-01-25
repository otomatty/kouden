"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Telegram } from "@/types/telegram";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface TelegramCardProps {
	telegram: Telegram;
	onDelete: () => Promise<void>;
}

export function TelegramCard({ telegram, onDelete }: TelegramCardProps) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex justify-between items-start gap-4">
					<div className="min-w-0 flex-1 space-y-3">
						<div className="flex items-center gap-2">
							<div className="font-medium truncate">
								{telegram.senderName ||
									telegram.senderOrganization ||
									"名前なし"}
							</div>
							{telegram.senderPosition && (
								<Badge variant="outline">{telegram.senderPosition}</Badge>
							)}
						</div>
						{telegram.message && (
							<div className="text-sm text-muted-foreground line-clamp-2">
								{telegram.message}
							</div>
						)}
						{telegram.notes && (
							<div className="text-sm text-muted-foreground line-clamp-2">
								{telegram.notes}
							</div>
						)}
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="ghost" size="icon" className="shrink-0">
								<Trash2 className="h-4 w-4" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>電報を削除</AlertDialogTitle>
								<AlertDialogDescription>
									この電報を削除してもよろしいですか？この操作は取り消せません。
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>キャンセル</AlertDialogCancel>
								<AlertDialogAction onClick={onDelete}>削除</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardContent>
		</Card>
	);
}
