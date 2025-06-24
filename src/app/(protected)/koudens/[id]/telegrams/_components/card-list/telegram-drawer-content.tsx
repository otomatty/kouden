// library
import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";

// ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableCheckboxList } from "@/components/ui/searchable-checkbox-list";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Pencil, Check, X, Trash2 } from "lucide-react";

// types
import type { Telegram, OptimisticTelegram } from "@/types/telegrams";
import type { Entry } from "@/types/entries";
import type { CheckboxListItem } from "@/components/ui/searchable-checkbox-list";
// utils
import { formatCurrency } from "@/utils/currency";
// store
import { permissionAtom, canUpdateData, canDeleteData } from "@/store/permission";
import { telegramsAtom, optimisticTelegramsAtom } from "@/store/telegrams";
// Server Actions
import { updateTelegramField, deleteTelegram } from "@/app/_actions/telegrams";
// components
import { EditableField } from "@/components/custom/editable-field";

interface TelegramDrawerContentProps {
	telegram: Telegram;
	koudenId: string;
	entries: Entry[];
	onClose: () => void;
}

export function TelegramDrawerContent({
	telegram,
	koudenId,
	onClose,
	entries,
}: TelegramDrawerContentProps) {
	const permission = useAtomValue(permissionAtom);
	const canEdit = canUpdateData(permission);
	const canDelete = canDeleteData(permission);
	const [telegrams, setTelegrams] = useAtom(telegramsAtom);
	const [optimisticTelegrams, setOptimisticTelegrams] = useAtom(optimisticTelegramsAtom);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// 関連する香典情報(entries)を取得
	const relatedEntry = entries.find((entry) => entry.id === telegram.koudenEntryId);

	// 香典エントリーをCheckboxListItem形式に変換
	const entryItems: CheckboxListItem[] = entries.map((entry) => ({
		value: entry.id,
		label: `${entry.name} - ${formatCurrency(entry.amount)}`,
	}));

	// 香典エントリーの選択変更ハンドラー
	const handleEntrySelectionChange = async (selectedValues: string[]) => {
		// 最後に選択された値を使用（単一選択の動作）
		const value = selectedValues[selectedValues.length - 1] || null;
		await handleUpdateField("koudenEntryId", value);
	};
	const handleUpdateField = async (field: keyof Telegram, value: string | null) => {
		try {
			// 楽観的更新を適用
			const optimisticTelegram: OptimisticTelegram = {
				...telegram,
				[field]: value,
				isOptimistic: true,
				isDeleted: false,
			};
			setOptimisticTelegrams([...optimisticTelegrams, optimisticTelegram]);

			// サーバーに更新を送信
			const updatedTelegram = await updateTelegramField(telegram.id, field, value);

			// 成功したら実際のエントリーを更新
			if (telegrams.length === 0) {
				setTelegrams([updatedTelegram]);
			} else {
				setTelegrams(telegrams.map((t) => (t.id === telegram.id ? updatedTelegram : t)));
			}

			// 楽観的更新を削除
			setOptimisticTelegrams(optimisticTelegrams.filter((t) => t.id !== telegram.id));

			toast.success("データを更新しました", {
				description: "変更内容が正常に保存されました",
			});
		} catch (error) {
			console.error("Failed to update telegram:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticTelegrams(optimisticTelegrams.filter((t) => t.id !== telegram.id));
			toast.error("データの更新に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		}
	};

	const handleDelete = async () => {
		try {
			// 楽観的更新を適用
			const optimisticTelegram: OptimisticTelegram = {
				...telegram,
				isOptimistic: true,
				isDeleted: true,
			};
			setOptimisticTelegrams([...optimisticTelegrams, optimisticTelegram]);

			// サーバーに削除を送信
			await deleteTelegram(telegram.id, koudenId);

			// 成功したら実際のエントリーを削除
			setTelegrams(telegrams.filter((t) => t.id !== telegram.id));
			// 楽観的更新を削除
			setOptimisticTelegrams(optimisticTelegrams.filter((t) => t.id !== telegram.id));

			toast.success("データを削除しました", {
				description: "弔電情報が正常に削除されました",
			});
			onClose();
		} catch (error) {
			console.error("Failed to delete telegram:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticTelegrams(optimisticTelegrams.filter((t) => t.id !== telegram.id));
			toast.error("データの削除に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsDeleteDialogOpen(false);
		}
	};

	return (
		<>
			{/* 削除確認ダイアログ */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>弔電情報の削除</AlertDialogTitle>
						<AlertDialogDescription>
							この弔電情報を削除してもよろしいですか？
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
							<div className="space-y-2">
								<DrawerTitle className="text-xl">
									{telegram.senderName || "送信者名未設定"}
								</DrawerTitle>
								<p className="text-sm text-muted-foreground">
									{telegram.senderOrganization || "所属組織未設定"}
								</p>
							</div>
						</div>
						{telegram.senderPosition && (
							<Badge variant="outline" className="font-normal mt-2">
								{telegram.senderPosition}
							</Badge>
						)}
						{relatedEntry && (
							<Badge variant="secondary" className="font-normal mt-2">
								{relatedEntry.name} - {formatCurrency(relatedEntry.amount)}
							</Badge>
						)}
					</DrawerHeader>

					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="basic">基本情報</TabsTrigger>
							<TabsTrigger value="message">メッセージ</TabsTrigger>
							<TabsTrigger value="relation">関連付け</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="mt-4 space-y-4">
							{/* 送信者情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">送信者情報</h4>
								<div className="space-y-2">
									<EditableField
										label="送信者名"
										value={telegram.senderName || "未設定"}
										onSave={(value) => handleUpdateField("senderName", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="所属組織"
										value={telegram.senderOrganization || "未設定"}
										onSave={(value) => handleUpdateField("senderOrganization", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="役職"
										value={telegram.senderPosition || "未設定"}
										onSave={(value) => handleUpdateField("senderPosition", value)}
										canEdit={canEdit}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="message" className="mt-4 space-y-4">
							{/* メッセージと備考 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">メッセージ内容</h4>
								<div className="space-y-2">
									{canEdit ? (
										<div className="space-y-2">
											<Label>メッセージ</Label>
											<Textarea
												value={telegram.message || ""}
												onChange={(e) => handleUpdateField("message", e.target.value)}
												placeholder="メッセージを入力"
												className="min-h-[100px]"
											/>
										</div>
									) : (
										<p className="text-sm whitespace-pre-wrap">
											{telegram.message || "メッセージなし"}
										</p>
									)}
								</div>
							</div>

							{/* 備考 */}
							{(telegram.notes || canEdit) && (
								<div className="rounded-lg border p-4">
									<h4 className="text-sm font-medium mb-3 text-muted-foreground">備考</h4>
									<EditableField
										label="備考"
										value={telegram.notes || "未設定"}
										onSave={(value) => handleUpdateField("notes", value)}
										canEdit={canEdit}
									/>
								</div>
							)}
						</TabsContent>

						<TabsContent value="relation" className="mt-4 space-y-4">
							{/* 香典との関連付け */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">香典との関連付け</h4>
								<div className="space-y-2">
									<SearchableCheckboxList
										items={entryItems}
										selectedItems={telegram.koudenEntryId ? [telegram.koudenEntryId] : []}
										onSelectionChange={handleEntrySelectionChange}
										searchPlaceholder="香典を検索..."
										className="w-full"
									/>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<DrawerFooter className="px-4 py-4 space-y-2">
						<div className="flex justify-between items-center w-full">
							<Button variant="outline" onClick={onClose}>
								閉じる
							</Button>
							{canDelete && (
								<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							)}
						</div>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</>
	);
}
