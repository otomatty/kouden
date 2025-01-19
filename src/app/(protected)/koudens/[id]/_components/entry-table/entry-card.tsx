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
import type { KoudenEntryTableData, EditKoudenEntryFormData } from "./types";
import { EntryDialog } from "./entry-dialog";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

interface EntryCardProps {
	entry: KoudenEntryTableData;
	koudenId: string;
	onEdit: (
		data: EditKoudenEntryFormData,
		entryId: string,
	) => Promise<KoudenEntryTableData>;
	onDelete: (id: string) => Promise<void>;
}

function formatPostalCode(code: string) {
	if (!code) return "";
	// 数字以外を削除
	const numbers = code.replace(/[^\d]/g, "");
	// 7桁になるように左を0で埋める
	const paddedNumbers = numbers.padStart(7, "0");
	// xxx-xxxxの形式に変換
	return `${paddedNumbers.slice(0, 3)}-${paddedNumbers.slice(3)}`;
}

export function EntryCard({
	entry,
	koudenId,
	onEdit,
	onDelete,
}: EntryCardProps) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	// データの変更を監視
	useEffect(() => {
		console.log("EntryCard: Entry data changed", entry);
	}, [entry]);

	const handleEdit = async (data: EditKoudenEntryFormData) => {
		console.log("EntryCard: Attempting to edit entry", {
			entryId: entry.id,
			currentData: entry,
			newData: data,
		});
		try {
			const updatedEntry = await onEdit(data, entry.id);
			console.log("EntryCard: Edit successful");
			toast({
				title: "更新成功",
				description: "データが正常に更新されました",
			});
			return updatedEntry;
		} catch (error) {
			console.error("EntryCard: Edit failed", error);
			toast({
				title: "更新エラー",
				description: "データの更新に失敗しました",
				variant: "destructive",
			});
			throw error;
		}
	};

	const handleDelete = async () => {
		console.log("EntryCard: Attempting to delete entry", entry.id);
		try {
			await onDelete(entry.id);
			console.log("EntryCard: Delete successful");
			toast({
				title: "削除成功",
				description: "データが正常に削除されました",
			});
		} catch (error) {
			console.error("EntryCard: Delete failed", error);
			toast({
				title: "削除エラー",
				description: "データの削除に失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Card className="w-full hover:bg-accent/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="space-y-1.5 flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-medium text-lg truncate">
										{entry.name || "名前未設定"}
									</h3>
									{entry.relationship && (
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
									{new Intl.NumberFormat("ja-JP", {
										style: "currency",
										currency: "JPY",
									}).format(entry.amount)}
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
									{new Intl.NumberFormat("ja-JP", {
										style: "currency",
										currency: "JPY",
									}).format(entry.amount)}
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
						{entry.relationship && (
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
							<Button
								className="w-full"
								variant="default"
								onClick={() => {
									console.log("EntryCard: Opening edit dialog");
									setIsEditDialogOpen(true);
								}}
							>
								<Pencil className="h-4 w-4 mr-2" />
								編集
							</Button>
							<Button
								className="w-full"
								variant="destructive"
								onClick={handleDelete}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								削除
							</Button>
						</div>
					</DrawerFooter>
				</div>
			</DrawerContent>

			<EntryDialog
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					console.log("EntryCard: Dialog state changed", { open });
					setIsEditDialogOpen(open);
				}}
				defaultValues={entry}
				onSave={handleEdit}
				koudenId={koudenId}
			/>
		</Drawer>
	);
}
