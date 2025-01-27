import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Pencil, Trash2 } from "lucide-react";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerFooter,
} from "@/components/ui/drawer";
import type { KoudenEntry } from "@/types/kouden";
import { EntryDialog } from "../dialog/entry-dialog";
import { DeleteEntryDialog } from "../dialog/delete-entry-dialog";
import { useState } from "react";
import { formatCurrency, formatPostalCode } from "@/lib/utils";

const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

interface EntryCardProps {
	entry: KoudenEntry;
	koudenId: string;
}

export function EntryCard({ entry, koudenId }: EntryCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Card className="w-full hover:bg-accent/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="space-y-1.5 flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-medium text-lg truncate">
										{entry.name || "名前未設定"}
									</h3>
									{entry.relationship?.name && (
										<Badge variant="outline" className="font-normal">
											{entry.relationship.name}
										</Badge>
									)}
								</div>
								{entry.organization && (
									<p className="text-sm text-muted-foreground truncate">
										{entry.organization}
									</p>
								)}
								<p className="text-2xl font-bold">
									{formatCurrency(entry.amount)}
								</p>
							</div>
							<div className="flex flex-col items-end gap-2 ml-4">
								<div className="space-y-1">
									<Badge variant="outline" className="whitespace-nowrap">
										{entry.attendance_type
											? attendanceTypeMap[entry.attendance_type]
											: "未設定"}
									</Badge>
									<Badge
										variant={
											entry.is_return_completed ? "default" : "secondary"
										}
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

			{/* Drawer Content */}
			<DrawerContent>
				<div className="mx-auto w-full max-w-sm">
					<DrawerHeader className="border-b">
						<div className="flex justify-between items-start">
							<div className="space-y-2">
								<DrawerTitle className="text-xl">
									{entry.name || "名前未設定"}
								</DrawerTitle>
								<p className="text-2xl font-bold">
									{formatCurrency(entry.amount)}
								</p>
							</div>
							<div className="space-y-1">
								<Badge variant="outline" className="whitespace-nowrap">
									{entry.attendance_type
										? attendanceTypeMap[entry.attendance_type]
										: "未設定"}
								</Badge>
								<Badge
									variant={entry.is_return_completed ? "default" : "secondary"}
									className="whitespace-nowrap"
								>
									{entry.is_return_completed ? "返礼済" : "未返礼"}
								</Badge>
							</div>
						</div>
						{entry.relationship?.name && (
							<Badge variant="outline" className="font-normal mt-2">
								{entry.relationship.name}
							</Badge>
						)}
					</DrawerHeader>

					<div className="p-4 space-y-6">
						{/* 団体・役職情報 */}
						{(entry.organization || entry.position) && (
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">
									所属情報
								</h4>
								<div className="space-y-2">
									{entry.organization && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												団体名
											</span>
											<span className="text-sm font-medium">
												{entry.organization}
											</span>
										</div>
									)}
									{entry.position && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												役職
											</span>
											<span className="text-sm font-medium">
												{entry.position}
											</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* 連絡先情報 */}
						<div className="rounded-lg border p-4">
							<h4 className="text-sm font-medium mb-3 text-muted-foreground">
								連絡先情報
							</h4>
							<div className="space-y-2">
								{entry.postal_code && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											郵便番号
										</span>
										<span className="text-sm font-medium flex items-center gap-1">
											<MapPin className="h-4 w-4" />〒
											{formatPostalCode(entry.postal_code)}
										</span>
									</div>
								)}
								{entry.address && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">住所</span>
										<span className="text-sm font-medium text-right flex-1 ml-4">
											{entry.address}
										</span>
									</div>
								)}
								{entry.phone_number && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											電話番号
										</span>
										<span className="text-sm font-medium">
											{entry.phone_number}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* 供物情報 */}
						<div className="rounded-lg border p-4">
							<h4 className="text-sm font-medium mb-3 text-muted-foreground">
								供物
							</h4>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">
									供物の有無
								</span>
								<span className="text-sm font-medium">
									{entry.has_offering ? "あり" : "なし"}
								</span>
							</div>
						</div>

						{/* 備考 */}
						{entry.notes && (
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">
									備考
								</h4>
								<p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
							</div>
						)}
					</div>

					<DrawerFooter className="px-4 py-4">
						<div className="flex flex-col gap-2 w-full">
							<EntryDialog
								variant="edit"
								koudenId={koudenId}
								defaultValues={entry}
								onSuccess={async (updatedEntry) => {
									setIsEditing(false);
									setIsOpen(false);
								}}
							/>
							<DeleteEntryDialog
								koudenId={koudenId}
								entryId={entry.id}
								entryName={entry.name || "名前未設定"}
								onSuccess={() => setIsOpen(false)}
							/>
						</div>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
