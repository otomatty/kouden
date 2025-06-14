"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReturnItemsGrid } from "./_components/return-items-grid";
import type { ReturnItem } from "@/types/return-records";

// TODO: 型定義とServer Actionsを実装後にimport
// import { getReturnItems } from "@/app/_actions/return-items/return-items";
// import type { ReturnItem } from "@/types/return-items";

interface ReturnItemsPageClientProps {
	koudenId: string;
}

/**
 * 返礼品管理のメインクライアントコンポーネント
 * 役割：返礼品の一覧表示、追加、編集、削除機能を提供
 */
export function ReturnItemsPageClient({ koudenId }: ReturnItemsPageClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);
	const { toast } = useToast();

	// TODO: 実際のデータ取得処理を実装後に削除
	// サンプルデータ（開発用）
	const sampleItems: ReturnItem[] = [
		{
			id: "1",
			name: "高級タオルセット",
			description: "今治タオルの高品質なタオルセット。贈り物に最適です。",
			price: 3000,
			category: "FUNERAL_GIFT",
			image_url: "https://via.placeholder.com/300x300?text=タオルセット",
			is_active: true,
			recommended_amount_min: 5000,
			recommended_amount_max: 10000,
			sort_order: 1,
			kouden_id: koudenId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			created_by: "sample-user-id",
		},
		{
			id: "2",
			name: "商品券（3000円分）",
			description: "全国の主要百貨店で使用可能な商品券です。",
			price: 3000,
			category: "GIFT_CARD",
			image_url: undefined,
			is_active: true,
			recommended_amount_min: 5000,
			recommended_amount_max: 8000,
			sort_order: 2,
			kouden_id: koudenId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			created_by: "sample-user-id",
		},
		{
			id: "3",
			name: "お茶・海苔詰合せ",
			description: "静岡茶と有明海苔の詰合せセット。日本の伝統的な贈り物です。",
			price: 2000,
			category: "FOOD",
			image_url: "https://via.placeholder.com/300x300?text=お茶海苔セット",
			is_active: false,
			recommended_amount_min: 3000,
			recommended_amount_max: 5000,
			sort_order: 3,
			kouden_id: koudenId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			created_by: "sample-user-id",
		},
		{
			id: "4",
			name: "プリザーブドフラワー",
			description: "長期間美しさを保つプリザーブドフラワーのアレンジメント。",
			price: 4500,
			category: "FLOWER",
			image_url: "https://via.placeholder.com/300x300?text=プリザーブドフラワー",
			is_active: true,
			recommended_amount_min: 8000,
			recommended_amount_max: 15000,
			sort_order: 4,
			kouden_id: koudenId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			created_by: "sample-user-id",
		},
		{
			id: "5",
			name: "カタログギフト",
			description: "豊富な商品から選べるカタログギフト。受け取る方の好みに合わせて選択可能。",
			price: 5000,
			category: "OTHER",
			image_url: undefined,
			is_active: true,
			recommended_amount_min: 10000,
			recommended_amount_max: undefined,
			sort_order: 5,
			kouden_id: koudenId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			created_by: "sample-user-id",
		},
	];

	// 返礼品データの再取得
	const handleRefresh = useCallback(async () => {
		try {
			setIsLoading(true);
			// TODO: データ取得処理を実装
			// await getReturnItems(koudenId);

			// サンプル用の遅延
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast({
				title: "更新完了",
				description: "返礼品データを更新しました",
			});
		} catch (error) {
			console.error("[ERROR] Failed to refresh return items:", error);
			toast({
				title: "更新エラー",
				description: "データの更新に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	// 返礼品作成ダイアログを開く
	const handleCreateItem = useCallback(() => {
		setSelectedItem(null);
		setShowCreateDialog(true);
	}, []);

	// 返礼品編集ダイアログを開く
	const handleEditItem = useCallback((item: ReturnItem) => {
		setSelectedItem(item);
		setShowEditDialog(true);
	}, []);

	// 返礼品削除
	const handleDeleteItem = useCallback(
		async (_itemId: string) => {
			try {
				// TODO: 削除処理を実装
				// await deleteReturnItem(itemId);

				toast({
					title: "削除完了",
					description: "返礼品を削除しました",
				});
			} catch (error) {
				console.error("[ERROR] Failed to delete return item:", error);
				toast({
					title: "削除エラー",
					description: "返礼品の削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[toast],
	);

	// 返礼品のアクティブ状態切り替え
	const handleToggleActive = useCallback(
		async (_itemId: string, _isActive: boolean) => {
			try {
				// TODO: アクティブ状態更新処理を実装
				// await updateReturnItemActive(itemId, isActive);

				toast({
					title: "更新完了",
					description: `返礼品を${_isActive ? "表示" : "非表示"}に設定しました`,
				});
			} catch (error) {
				console.error("[ERROR] Failed to toggle return item active:", error);
				toast({
					title: "更新エラー",
					description: "返礼品の状態更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[toast],
	);

	return (
		<div className="space-y-6">
			{/* アクションバー */}
			<div className="flex justify-between items-center">
				<div className="flex items-center space-x-2">
					<Button
						onClick={handleRefresh}
						variant="outline"
						disabled={isLoading}
						className="flex items-center gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
						{isLoading ? "更新中..." : "更新"}
					</Button>
				</div>

				<Button onClick={handleCreateItem}>
					<Plus className="h-4 w-4 mr-2" />
					返礼品を追加
				</Button>
			</div>

			{/* 返礼品グリッド */}
			<ReturnItemsGrid
				items={sampleItems}
				onEdit={handleEditItem}
				onDelete={handleDeleteItem}
				onToggleActive={handleToggleActive}
				isLoading={isLoading}
			/>

			{/* TODO: 返礼品作成ダイアログ */}
			{showCreateDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">返礼品を追加</h3>
						<p className="text-muted-foreground mb-4">
							返礼品作成フォームは次のステップで実装します
						</p>
						<Button onClick={() => setShowCreateDialog(false)} variant="outline" className="w-full">
							閉じる
						</Button>
					</div>
				</div>
			)}

			{/* TODO: 返礼品編集ダイアログ */}
			{showEditDialog && selectedItem && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">返礼品を編集</h3>
						<p className="text-muted-foreground mb-2">編集対象: {selectedItem.name}</p>
						<p className="text-muted-foreground mb-4">
							返礼品編集フォームは次のステップで実装します
						</p>
						<Button onClick={() => setShowEditDialog(false)} variant="outline" className="w-full">
							閉じる
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
