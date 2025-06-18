"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReturnItemsGrid } from "./_components/return-items-grid";
import { ReturnItemCreateDialog } from "./_components/return-item-create-dialog";
import { ReturnItemEditDialog } from "./_components/return-item-edit-dialog";
import {
	getReturnItems,
	deleteReturnItem,
	updateReturnItem,
} from "@/app/_actions/return-records/return-items";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemsPageClientProps {
	koudenId: string;
}

/**
 * 返礼品管理のメインクライアントコンポーネント
 * 役割：返礼品の一覧表示、追加、編集、削除機能を提供
 */
export function ReturnItemsPageClient({ koudenId }: ReturnItemsPageClientProps) {
	const [items, setItems] = useState<ReturnItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);
	const { toast } = useToast();

	// 初期データ取得
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setIsLoading(true);
				const data = await getReturnItems(koudenId);
				setItems(data);
			} catch (error) {
				console.error("[ERROR] Failed to load initial return items:", error);
				toast({
					title: "データ読み込みエラー",
					description: "返礼品データの読み込みに失敗しました",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();
	}, [koudenId, toast]);

	// 返礼品データの再取得
	const handleRefresh = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await getReturnItems(koudenId);
			setItems(data);

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
	}, [koudenId, toast]);

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
		async (itemId: string) => {
			try {
				await deleteReturnItem(itemId, koudenId);
				// データを再取得してUIを更新
				await handleRefresh();

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
		[koudenId, handleRefresh, toast],
	);

	// 返礼品のアクティブ状態切り替え
	const handleToggleActive = useCallback(
		async (itemId: string, isActive: boolean) => {
			try {
				await updateReturnItem({
					id: itemId,
					is_active: isActive,
					kouden_id: koudenId,
				});
				// データを再取得してUIを更新
				await handleRefresh();

				toast({
					title: "更新完了",
					description: `返礼品を${isActive ? "表示" : "非表示"}に設定しました`,
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
		[koudenId, handleRefresh, toast],
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
				items={items}
				onEdit={handleEditItem}
				onDelete={handleDeleteItem}
				onToggleActive={handleToggleActive}
				isLoading={isLoading}
				koudenId={koudenId}
			/>

			{/* 返礼品作成ダイアログ */}
			<ReturnItemCreateDialog
				open={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
				koudenId={koudenId}
				onSuccess={handleRefresh}
			/>

			{/* 返礼品編集ダイアログ */}
			{selectedItem && (
				<ReturnItemEditDialog
					open={showEditDialog}
					onClose={() => setShowEditDialog(false)}
					returnItem={selectedItem}
					koudenId={koudenId}
					onSuccess={handleRefresh}
				/>
			)}
		</div>
	);
}
