// library
import { useState } from "react";
import { useAtomValue } from "jotai";
// ui
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Gift } from "lucide-react";

// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// utils
import { formatCurrency } from "@/utils/currency";
// components
import { EntryDialog } from "../dialog/entry-dialog";
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

	// 返礼状況の判定（新しいreturn_statusがある場合はそれを使用、なければis_return_completedから判定）
	const isReturnCompleted =
		entry.return_status === "COMPLETED" ||
		(entry.return_status ? false : entry.is_return_completed);
	const returnStatusDisplay = entry.status_display || (isReturnCompleted ? "返礼済" : "未返礼");

	return (
		<EntryDialog
			koudenId={koudenId}
			relationships={relationships}
			defaultValues={entry}
			variant="edit"
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
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
										variant={isReturnCompleted ? "default" : "secondary"}
										className="whitespace-nowrap"
									>
										{returnStatusDisplay}
									</Badge>
								</div>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			}
		/>
	);
}
