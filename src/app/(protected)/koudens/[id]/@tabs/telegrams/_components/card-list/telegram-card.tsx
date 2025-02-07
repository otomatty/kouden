// library
import { useState } from "react";
import { useAtomValue } from "jotai";
// ui
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
// types
import type { Telegram } from "@/types/telegrams";
import type { Entry } from "@/types/entries";
// components
import { TelegramDrawerContent } from "./telegram-drawer-content";
// stores
import { mergedTelegramsAtom } from "@/store/telegrams";

interface TelegramCardProps {
	telegram: Telegram;
	koudenId: string;
	entries: Entry[];
}

export function TelegramCard({ telegram: initialTelegram, koudenId, entries }: TelegramCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const mergedTelegrams = useAtomValue(mergedTelegramsAtom);

	// 最新の電報情報を取得（楽観的更新を含む）
	const telegram = mergedTelegrams.find((t) => t.id === initialTelegram.id) || initialTelegram;

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Card className="w-full hover:bg-accent/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="space-y-1.5 flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-medium text-lg truncate">
										{telegram.senderName || "差出人未設定"}
									</h3>
								</div>
								{telegram.senderOrganization && (
									<p className="text-sm text-muted-foreground truncate">
										{telegram.senderOrganization}
									</p>
								)}
							</div>
							<div className="flex flex-col items-end gap-2 ml-4">
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			</DrawerTrigger>

			<TelegramDrawerContent
				telegram={telegram}
				koudenId={koudenId}
				entries={entries}
				onClose={() => setIsOpen(false)}
			/>
		</Drawer>
	);
}
