"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
	ArrowLeft,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	Package,
	JapaneseYen,
	Calendar,
	User,
	Tag,
	AlertTriangle,
} from "lucide-react";
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
import { deleteReturnItem, updateReturnItem } from "@/app/_actions/return-records/return-items";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemDetailPageClientProps {
	returnItem: ReturnItem;
	koudenId: string;
}

/**
 * 返礼品詳細ページのクライアントコンポーネント
 * 役割：返礼品の詳細情報表示、編集・削除・状態変更アクション
 */
export function ReturnItemDetailPageClient({
	returnItem,
	koudenId,
}: ReturnItemDetailPageClientProps) {
	const [item, setItem] = useState<ReturnItem>(returnItem);
	const [imageError, setImageError] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();

	// カテゴリの表示名を取得
	const getCategoryLabel = (category: string | null) => {
		if (!category) return "未設定";
		const categoryMap: Record<string, string> = {
			FUNERAL_GIFT: "会葬品",
			GIFT_CARD: "ギフト券",
			FOOD: "食品",
			FLOWER: "花・植物",
			OTHER: "その他",
		};
		return categoryMap[category] || category;
	};

	// カテゴリの色を取得
	const getCategoryColor = (category: string | null) => {
		if (!category) return "bg-gray-100 text-gray-800";
		const colorMap: Record<string, string> = {
			FUNERAL_GIFT: "bg-blue-100 text-blue-800",
			GIFT_CARD: "bg-green-100 text-green-800",
			FOOD: "bg-orange-100 text-orange-800",
			FLOWER: "bg-pink-100 text-pink-800",
			OTHER: "bg-gray-100 text-gray-800",
		};
		return colorMap[category] || "bg-gray-100 text-gray-800";
	};

	// 推奨金額の表示
	const getRecommendedAmountText = () => {
		if (!item.recommended_amount_min) return "設定なし";
		if (item.recommended_amount_max) {
			return `${item.recommended_amount_min.toLocaleString()}円 〜 ${item.recommended_amount_max.toLocaleString()}円`;
		}
		return `${item.recommended_amount_min.toLocaleString()}円 〜`;
	};

	// 一覧ページに戻る
	const handleBack = useCallback(() => {
		router.push(`/koudens/${koudenId}/return_records/items`);
	}, [router, koudenId]);

	// 編集ページに遷移（将来実装予定）
	const handleEdit = useCallback(() => {
		// TODO: 編集ページへの遷移を実装
		toast.info("編集機能", {
			description: "編集機能は次のステップで実装予定です",
		});
	}, []);

	// アクティブ状態切り替え
	const handleToggleActive = useCallback(async () => {
		try {
			setIsUpdating(true);
			const newActiveState = !item.is_active;

			await updateReturnItem({
				id: item.id,
				is_active: newActiveState,
				kouden_id: koudenId,
			});

			setItem((prev) => ({ ...prev, is_active: newActiveState }));

			toast.success("更新完了", {
				description: `返礼品を${newActiveState ? "表示" : "非表示"}に設定しました`,
			});
		} catch (error) {
			console.error("[ERROR] Failed to toggle return item active:", error);
			toast.error("更新エラー", {
				description: "返礼品の状態更新に失敗しました",
			});
		} finally {
			setIsUpdating(false);
		}
	}, [item.id, item.is_active, koudenId]);

	// 削除処理
	const handleDelete = useCallback(async () => {
		try {
			setIsDeleting(true);

			await deleteReturnItem(item.id, koudenId);

			toast.success("削除完了", {
				description: "返礼品を削除しました",
			});

			// 一覧ページに戻る
			router.push(`/koudens/${koudenId}/return_records/items`);
		} catch (error) {
			console.error("[ERROR] Failed to delete return item:", error);
			toast.error("削除エラー", {
				description: "返礼品の削除に失敗しました",
			});
			setIsDeleting(false);
		}
	}, [item.id, koudenId, router]);

	// 日時フォーマット
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={handleBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						一覧に戻る
					</Button>
					<div className="h-6 w-px bg-border" />
					<h1 className="text-2xl font-bold">返礼品詳細</h1>
				</div>

				<div className="flex items-center gap-2">
					{/* アクティブ状態表示 */}
					<Badge
						variant={item.is_active ? "default" : "secondary"}
						className="flex items-center gap-1"
					>
						{item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
						{item.is_active ? "表示中" : "非表示"}
					</Badge>

					{/* アクションボタン */}
					<Button variant="outline" size="sm" onClick={handleEdit}>
						<Edit className="h-4 w-4 mr-2" />
						編集
					</Button>

					<Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isUpdating}>
						{item.is_active ? (
							<>
								<EyeOff className="h-4 w-4 mr-2" />
								非表示にする
							</>
						) : (
							<>
								<Eye className="h-4 w-4 mr-2" />
								表示する
							</>
						)}
					</Button>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" disabled={isDeleting}>
								<Trash2 className="h-4 w-4 mr-2" />
								削除
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-destructive" />
									返礼品を削除しますか？
								</AlertDialogTitle>
								<AlertDialogDescription>
									「{item.name}」を完全に削除します。この操作は元に戻せません。
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>キャンセル</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-destructive hover:bg-destructive/90"
								>
									削除する
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				{/* メイン情報 */}
				<div className="lg:col-span-2 space-y-6">
					{/* 基本情報カード */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="space-y-2">
									<CardTitle className="text-xl">{item.name}</CardTitle>
									<Badge className={getCategoryColor(item.category)}>
										<Tag className="h-3 w-3 mr-1" />
										{getCategoryLabel(item.category)}
									</Badge>
								</div>
								<div className="text-right">
									<div className="flex items-center text-2xl font-bold text-primary">
										<JapaneseYen className="h-5 w-5 mr-1" />
										{item.price.toLocaleString()}
									</div>
									<div className="text-sm text-muted-foreground">税込価格</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* 商品画像 */}
							<div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
								{item.image_url && !imageError ? (
									<img
										src={item.image_url}
										alt={item.name}
										className="w-full h-full object-cover"
										onError={() => setImageError(true)}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<Package className="h-16 w-16 text-muted-foreground" />
									</div>
								)}
							</div>

							{/* 説明文 */}
							{item.description && (
								<div>
									<h3 className="font-semibold mb-2">商品説明</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{item.description}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 推奨金額カード */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">推奨香典金額</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-lg font-semibold">{getRecommendedAmountText()}</div>
							<p className="text-sm text-muted-foreground mt-1">
								この返礼品に適した香典金額の目安です
							</p>
						</CardContent>
					</Card>
				</div>

				{/* サイドバー */}
				<div className="space-y-6">
					{/* 詳細情報カード */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">詳細情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm">
									<div className="font-medium text-muted-foreground w-20">表示順序:</div>
									<div>{item.sort_order}</div>
								</div>

								<Separator />

								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<div className="font-medium text-muted-foreground">作成日時:</div>
								</div>
								<div className="text-sm ml-6">{formatDate(item.created_at)}</div>

								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<div className="font-medium text-muted-foreground">更新日時:</div>
								</div>
								<div className="text-sm ml-6">{formatDate(item.updated_at)}</div>

								<Separator />

								<div className="flex items-center gap-2 text-sm">
									<User className="h-4 w-4 text-muted-foreground" />
									<div className="font-medium text-muted-foreground">作成者ID:</div>
								</div>
								<div className="text-sm ml-6 font-mono text-xs break-all">{item.created_by}</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
