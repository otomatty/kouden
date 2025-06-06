// library
import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";

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
import type { Offering, OptimisticOffering, OfferingType } from "@/types/offerings";
import type { Entry } from "@/types/entries";
// stores
import { permissionAtom, canUpdateData, canDeleteData } from "@/store/permission";
import { offeringsAtom, optimisticOfferingsAtom } from "@/store/offerings";
// Server Actions
import { updateOfferingField, deleteOffering } from "@/app/_actions/offerings";
// components
import { EditableField } from "@/components/custom/editable-field";
import { formatCurrency } from "@/utils/currency";
import { typeLabels } from "../table/constants";

interface OfferingDrawerContentProps {
	offering: Offering;
	koudenId: string;
	onClose: () => void;
}

export function OfferingDrawerContent({ offering, koudenId, onClose }: OfferingDrawerContentProps) {
	const permission = useAtomValue(permissionAtom);
	const canEdit = canUpdateData(permission);
	const canDelete = canDeleteData(permission);
	const [offerings, setOfferings] = useAtom(offeringsAtom);
	const [optimisticOfferings, setOptimisticOfferings] = useAtom(optimisticOfferingsAtom);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { toast } = useToast();

	const handleUpdateField = async (
		field: keyof Offering,
		value: string | boolean | number | null,
	) => {
		try {
			// 楽観的更新を適用
			const optimisticOffering: OptimisticOffering = {
				...offering,
				[field]: value,
				isOptimistic: true,
				isDeleted: false,
			};
			setOptimisticOfferings([...optimisticOfferings, optimisticOffering]);

			// サーバーに更新を送信
			const updatedOffering = await updateOfferingField(offering.id, field, value);

			// 成功したら実際の提供物を更新（既存のリレーションデータを保持）
			const updatedOfferingWithRelations = {
				...updatedOffering,
				offeringPhotos: offering.offeringPhotos,
				offeringEntries: offering.offeringEntries,
			};

			if (offerings.length === 0) {
				setOfferings([updatedOfferingWithRelations]);
			} else {
				setOfferings(
					offerings.map((o) => (o.id === offering.id ? updatedOfferingWithRelations : o)),
				);
			}

			// 楽観的更新を削除
			setOptimisticOfferings(optimisticOfferings.filter((o) => o.id !== offering.id));

			toast({
				title: "更新完了",
				description: "データを更新しました",
			});
		} catch (error) {
			console.error("Failed to update offering:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticOfferings(optimisticOfferings.filter((o) => o.id !== offering.id));
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
			const optimisticOffering: OptimisticOffering = {
				...offering,
				isOptimistic: true,
				isDeleted: true,
			};
			setOptimisticOfferings([...optimisticOfferings, optimisticOffering]);

			// サーバーに削除を送信
			await deleteOffering(offering.id, koudenId);

			// 成功したら実際の提供物を削除
			setOfferings(offerings.filter((o) => o.id !== offering.id));

			// 楽観的更新を削除
			setOptimisticOfferings(optimisticOfferings.filter((o) => o.id !== offering.id));

			toast({
				title: "削除完了",
				description: "データを削除しました",
			});
			onClose();
		} catch (error) {
			console.error("Failed to delete offering:", error);
			// エラーの場合は楽観的更新を削除
			setOptimisticOfferings(optimisticOfferings.filter((o) => o.id !== offering.id));
			toast({
				title: "エラーが発生しました",
				description: "データの削除に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsDeleteDialogOpen(false);
		}
	};

	return (
		<>
			{/* 削除ダイアログ */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>お供物の削除</AlertDialogTitle>
						<AlertDialogDescription>
							このお供物を削除してもよろしいですか？
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
								<DrawerTitle className="text-xl">
									{typeLabels[offering.type as OfferingType] || "提供物未設定"}
								</DrawerTitle>
								<p className="text-2xl font-bold">{formatCurrency(offering.price || 0)}</p>
							</div>
							<div className="space-y-2 flex flex-col items-end">
								<Badge
									variant={offering.quantity > 0 ? "default" : "secondary"}
									className="whitespace-nowrap"
								>
									{offering.quantity > 0 ? "供物あり" : "供物なし"}
								</Badge>
							</div>
						</div>
					</DrawerHeader>

					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic">基本情報</TabsTrigger>
							<TabsTrigger value="additional">追加情報</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="mt-4 space-y-4">
							{/* 基本情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">基本情報</h4>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>種類</Label>
										<Select
											value={offering.type}
											onValueChange={(value) => handleUpdateField("type", value)}
											disabled={!canEdit}
										>
											<SelectTrigger>
												<SelectValue placeholder="種類を選択">
													{typeLabels[offering.type as OfferingType]}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FLOWER">供花</SelectItem>
												<SelectItem value="FOOD">供物</SelectItem>
												<SelectItem value="INCENSE">線香</SelectItem>
												<SelectItem value="MONEY">御供物料</SelectItem>
												<SelectItem value="OTHER">その他</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<EditableField
										label="提供者名"
										value={offering.provider_name}
										onSave={(value) => handleUpdateField("provider_name", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="内容"
										value={offering.description || "未設定"}
										onSave={(value) => handleUpdateField("description", value)}
										canEdit={canEdit}
									/>
									<EditableField
										label="数量"
										value={String(offering.quantity)}
										onSave={(value) => handleUpdateField("quantity", Number.parseInt(value, 10))}
										canEdit={canEdit}
									/>
									<EditableField
										label="金額"
										value={offering.price ? String(offering.price) : "未設定"}
										onSave={(value) =>
											handleUpdateField("price", value ? Number.parseInt(value, 10) : null)
										}
										canEdit={canEdit}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="additional" className="mt-4 space-y-4">
							{/* 関連する香典情報 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">関連する香典情報</h4>
								<div className="flex flex-wrap gap-2">
									{offering.offeringEntries.length === 0 ? (
										<span className="text-muted-foreground">なし</span>
									) : (
										offering.offeringEntries.map((entry) => (
											<Badge key={entry.id} variant="secondary">
												{entry.koudenEntry?.id}
											</Badge>
										))
									)}
								</div>
							</div>

							{/* 備考 */}
							<div className="rounded-lg border p-4">
								<h4 className="text-sm font-medium mb-3 text-muted-foreground">備考</h4>
								<EditableField
									label="備考"
									value={offering.notes || "未設定"}
									onSave={(value) => handleUpdateField("notes", value)}
									canEdit={canEdit}
								/>
							</div>

							{/* 写真 */}
							{offering.offeringPhotos.length > 0 && (
								<div className="rounded-lg border p-4">
									<h4 className="text-sm font-medium mb-3 text-muted-foreground">写真</h4>
									<div className="grid grid-cols-2 gap-2">
										{offering.offeringPhotos.map((photo) => (
											<div key={photo.id} className="relative aspect-square">
												<Image
													src={`/api/storage/${photo.storage_key}`}
													alt={photo.caption || "写真"}
													className="object-cover rounded-md"
													fill
													sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												/>
											</div>
										))}
									</div>
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
