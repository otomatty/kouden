// library
import { useState } from "react";
import { useAtomValue } from "jotai";
// ui
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Gift } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";

// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// utils
import { formatCurrency } from "@/utils/currency";
// components
import { EntryDrawerContent } from "./entry-drawer-content";
// stores
import { mergedEntriesAtom } from "@/store/entries";

interface EntryCardProps {
	entry: Entry;
	koudenId: string;
	relationships: Relationship[];
}

export function EntryCard({ entry: initialEntry, koudenId, relationships }: EntryCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const mergedEntries = useAtomValue(mergedEntriesAtom);

	// 最新のエントリー情報を取得（楽観的更新を含む）
	const entry = mergedEntries.find((e) => e.id === initialEntry.id) || initialEntry;

	// 関係性の名前を取得
	const relationshipName = relationships.find((r) => r.id === entry.relationship_id)?.name;

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Card className="w-full hover:bg-accent/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="space-y-1.5 flex-1 min-w-0">
								{entry.organization && (
									<p className="text-sm text-muted-foreground truncate">{entry.organization}</p>
								)}
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-medium text-lg truncate">{entry.name || "名前未設定"}</h3>
								</div>
								<p className="text-2xl font-bold">{formatCurrency(entry.amount)}</p>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<div className="space-y-2 flex flex-col items-end">
									{relationshipName && (
										<Badge variant="outline" className="font-normal">
											{relationshipName}
										</Badge>
									)}
									<Badge
										variant={entry.has_offering ? "default" : "secondary"}
										className="whitespace-nowrap flex items-center gap-1"
									>
										<Gift className="h-3 w-3" />
										{entry.has_offering ? "供物あり" : "供物なし"}
									</Badge>
									<Badge
										variant={entry.is_return_completed ? "default" : "secondary"}
										className="whitespace-nowrap"
									>
										{entry.is_return_completed ? "返礼済" : "未返礼"}
									</Badge>
								</div>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			</DrawerTrigger>

			<EntryDrawerContent
				entry={entry}
				koudenId={koudenId}
				relationships={relationships}
				onClose={() => setIsOpen(false)}
			/>
		</Drawer>
	);
}
