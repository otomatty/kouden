// library
import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";

// ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2 } from "lucide-react";
// types
import type { Entry, OptimisticEntry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// utils
import { formatCurrency } from "@/utils/currency";
import { formatPostalCode } from "@/utils/postal-code";
// stores
import { permissionAtom, canUpdateData, canDeleteData } from "@/store/permission";
import { entriesAtom, optimisticEntriesAtom } from "@/store/entries";
// Server Actions
import { updateEntryField, deleteEntry } from "@/app/_actions/entries";
// components
import { EditableField } from "@/components/custom/editable-field";

interface EntryDrawerContentProps {
	entry: Entry;
	koudenId: string;
	relationships: Relationship[];
	onClose: () => void;
}

export function EntryDrawerContent({
	entry,
	koudenId,
	relationships,
	onClose,
}: EntryDrawerContentProps) {
	const permission = useAtomValue(permissionAtom);
	const canEdit = canUpdateData(permission);
	const canDelete = canDeleteData(permission);
	const [entries, setEntries] = useAtom(entriesAtom);
	const [optimisticEntries, setOptimisticEntries] = useAtom(optimisticEntriesAtom);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { toast } = useToast();

	const handleUpdateField = async (field: keyof Entry, value: string | boolean) => {
		try {
			// 楽観的更新を適用
			const optimisticEntry: OptimisticEntry = {
				...entry,
				[field]: value,
				isOptimistic: true,
				isDeleted: false,
			};
			setOptimisticEntries([...optimisticEntries, optimisticEntry]);

			// サーバーに更新を送信
			const updatedEntry = await updateEntryField(entry.id, field, value);

			// 成功したら実際のエントリーを更新
			if (entries.length === 0) {
				setEntries([updatedEntry]);
			} else {
				setEntries(entries.map((e) => (e.id === entry.id ? updatedEntry : e)));
			}

			// 楽観的更新を削除
			setOptimisticEntries(optimisticEntries.filter((e) => e.id !== entry.id));

			toast({
				title: "更新完了",
				description: "データを更新しました",
			});
		} catch (error) {
			console.error("Failed to update entry:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticEntries(optimisticEntries.filter((e) => e.id !== entry.id));
			toast({
				title: "エラーが発生しました",
				description: "データの更新に失敗しました",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async () => {
		try {
			// 楽観的更新を適用
			const optimisticEntry: OptimisticEntry = {
				...entry,
				isOptimistic: true,
				isDeleted: true,
			};
			setOptimisticEntries([...optimisticEntries, optimisticEntry]);

			// サーバーに削除を送信
			await deleteEntry(entry.id, koudenId);

			// 成功したら実際のエントリーを削除
			setEntries(entries.filter((e) => e.id !== entry.id));
			// 楽観的更新を削除
			setOptimisticEntries(optimisticEntries.filter((e) => e.id !== entry.id));

			toast({
				title: "削除完了",
				description: "データを削除しました",
			});
			onClose();
		} catch (error) {
			console.error("Failed to delete entry:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticEntries(optimisticEntries.filter((e) => e.id !== entry.id));
			toast({
				title: "エラーが発生しました",
				description: "データの削除に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsDeleteDialogOpen(false);
		}
	};

	// 関係性の名前を取得
	const relationshipName = relationships.find((r) => r.id === entry.relationship_id)?.name;

	return (
		<>
			{/* 削除ダイアログ */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>香典情報の削除</AlertDialogTitle>
						<AlertDialogDescription>
							この香典情報を削除してもよろしいですか？
							<br />
							この操作は取り消すことができません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							削除する
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* ドロワー */}
			<DrawerContent>
				<div className="mx-auto w-full max-w-sm">
					<DrawerHeader className="border-b">
						<div className="flex justify-between items-start">
							<div className="space-y-2 text-left">
								{relationshipName && (
									<p className="text-sm text-muted-foreground mt-2">{relationshipName}</p>
								)}
								<DrawerTitle className="text-xl">{entry.name || "名前未設定"}</DrawerTitle>
								<p className="text-2xl font-bold">{formatCurrency(entry.amount)}</p>
							</div>
							<div className="space-y-2 flex flex-col items-end">
								<Badge
									variant={entry.has_offering ? "default" : "secondary"}
									className="whitespace-nowrap"
								>
									{entry.has_offering ? "供物あり" : "供物なし"}
								</Badge>
								<Badge
									variant={entry.is_return_completed ? "default" : "secondary"}
									className="whitespace-nowrap"
								>
									{entry.is_return_completed ? "返礼済" : "未返礼"}
								</Badge>
							</div>
						</div>
					</DrawerHeader>

					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="basic">基本情報</TabsTrigger>
							<TabsTrigger value="contact">連絡先</TabsTrigger>
							<TabsTrigger value="additional">追加情報</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="mt-4 space-y-4">
							{/* 参列タイプと関係性 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">基本情報</h4>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>参列タイプ</Label>
										<Select
											value={entry.attendance_type || "ABSENT"}
											onValueChange={(value) => handleUpdateField("attendance_type", value)}
											disabled={!canEdit}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FUNERAL">葬儀</SelectItem>
												<SelectItem value="CONDOLENCE_VISIT">弔問</SelectItem>
												<SelectItem value="ABSENT">欠席</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>関係性</Label>
										<Select
											value={entry.relationship_id || ""}
											onValueChange={(value) => handleUpdateField("relationship_id", value)}
											disabled={!canEdit}
										>
											<SelectTrigger>
												<SelectValue placeholder="関係性を選択" />
											</SelectTrigger>
											<SelectContent>
												{relationships.map((relationship) => (
													<SelectItem key={relationship.id} value={relationship.id}>
														{relationship.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* 団体・役職情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">所属情報</h4>
								<div className="space-y-2">
									<EditableField
										label="団体名"
										value={entry.organization || "未設定"}
										onSave={(value) => handleUpdateField("organization", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="役職"
										value={entry.position || "未設定"}
										onSave={(value) => handleUpdateField("position", value)}
										canEdit={canEdit}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="contact" className="mt-4 space-y-4">
							{/* 連絡先情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">連絡先情報</h4>
								<div className="space-y-2">
									<EditableField
										label="郵便番号"
										value={
											entry.postal_code ? `〒${formatPostalCode(entry.postal_code)}` : "未設定"
										}
										onSave={(value) =>
											handleUpdateField("postal_code", value.replace(/[〒\s-]/g, ""))
										}
										canEdit={canEdit}
									/>
									<EditableField
										label="住所"
										value={entry.address || "未設定"}
										onSave={(value) => handleUpdateField("address", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="電話番号"
										value={entry.phone_number || "未設定"}
										onSave={(value) => handleUpdateField("phone_number", value)}
										canEdit={canEdit}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="additional" className="mt-4 space-y-4">
							{/* 供物情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">供物</h4>
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">供物の有無</span>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">
												{entry.has_offering ? "あり" : "なし"}
											</span>
											{canEdit && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleUpdateField("has_offering", !entry.has_offering)}
												>
													{entry.has_offering ? "なしに変更" : "ありに変更"}
												</Button>
											)}
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">返礼状況</span>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">
												{entry.is_return_completed ? "返礼済" : "未返礼"}
											</span>
											{canEdit && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleUpdateField("is_return_completed", !entry.is_return_completed)
													}
												>
													{entry.is_return_completed ? "未返礼に変更" : "返礼済に変更"}
												</Button>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* 備考 */}
							{(entry.notes || canEdit) && (
								<div className="rounded-lg border p-4">
									<h4 className="text-sm font-medium mb-3 text-muted-foreground">備考</h4>
									<EditableField
										label="備考"
										value={entry.notes || "未設定"}
										onSave={(value) => handleUpdateField("notes", value)}
										canEdit={canEdit}
									/>
								</div>
							)}
						</TabsContent>
					</Tabs>

					<DrawerFooter className="px-0 space-y-2">
						<div className="flex justify-between items-center gap-2 w-full">
							{canDelete && (
								<Button
									variant="destructive"
									className="w-full"
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash2 className="h-6 w-6" />
									削除する
								</Button>
							)}
							<Button className="w-full" onClick={onClose}>
								<X className="h-6 w-6" />
								閉じる
							</Button>
						</div>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</>
	);
}
