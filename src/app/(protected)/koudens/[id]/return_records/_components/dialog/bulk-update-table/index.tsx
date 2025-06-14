"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2 } from "lucide-react";

// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { AmountGroupData, ReturnItemMaster } from "@/types/return-records/bulk-update";

// utils
import { groupRecordsByAmount } from "@/utils/bulk-update-helpers";

// actions
import {
	getReturnItemsForBulkUpdate,
	executeBulkUpdateMultipleGroups,
} from "@/app/_actions/return-records/bulk-update";
import { getAllReturnRecordsForBulkUpdate } from "@/app/_actions/return-records/return-records";

// components
import { BulkUpdateTable } from "./bulk-update-table";

interface BulkUpdateTableDialogProps {
	koudenId: string;
	onBulkUpdate?: (config?: unknown) => Promise<void>;
	trigger?: React.ReactNode;
}

/**
 * 新しい一括更新ダイアログ（テーブル形式）
 */
export function BulkUpdateTableDialog({
	koudenId,
	onBulkUpdate,
	trigger,
}: BulkUpdateTableDialogProps) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(false);

	// データ状態
	const [_allReturnRecords, setAllReturnRecords] = useState<ReturnManagementSummary[]>([]);
	const [amountGroups, setAmountGroups] = useState<AmountGroupData[]>([]);
	const [availableReturnItems, setAvailableReturnItems] = useState<ReturnItemMaster[]>([]);

	// ダイアログが開かれた時の初期化
	useEffect(() => {
		if (open) {
			const initializeData = async () => {
				setIsLoadingData(true);
				try {
					// 全返礼記録を取得
					const allRecords = await getAllReturnRecordsForBulkUpdate(koudenId);
					setAllReturnRecords(allRecords);

					// 返礼品マスタを取得
					const returnItems = await getReturnItemsForBulkUpdate(koudenId);
					setAvailableReturnItems(returnItems);

					// 金額グループを初期化
					const initialGroups = groupRecordsByAmount(allRecords);
					setAmountGroups(initialGroups);
				} catch (error) {
					console.error("データ初期化エラー:", error);
					toast({
						title: "データ読み込みエラー",
						description: "データの取得に失敗しました",
						variant: "destructive",
					});
				} finally {
					setIsLoadingData(false);
				}
			};

			initializeData();
		}
	}, [open, koudenId, toast]);

	// ダイアログが閉じられた時のリセット
	useEffect(() => {
		if (!open) {
			setAllReturnRecords([]);
			setAmountGroups([]);
			setAvailableReturnItems([]);
		}
	}, [open]);

	// 一括更新の実行
	const handleExecuteUpdate = async () => {
		// 変更があるグループのみを抽出
		const groupsWithChanges = amountGroups.filter(
			(group) => group.selectedReturnItemIds.length > 0 || group.status !== "PENDING",
		);

		if (groupsWithChanges.length === 0) {
			toast({
				title: "更新対象なし",
				description: "変更する項目を選択してください",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			const result = await executeBulkUpdateMultipleGroups(koudenId, groupsWithChanges);

			if (result.successCount > 0) {
				toast({
					title: "一括更新完了",
					description: `${result.successCount}件の返礼記録を更新しました`,
				});

				// 親コンポーネントのデータ更新
				if (onBulkUpdate) {
					await onBulkUpdate({});
				}

				setOpen(false);
			}

			if (result.failureCount > 0) {
				toast({
					title: "一部更新失敗",
					description: `${result.failureCount}件の更新に失敗しました`,
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("一括更新エラー:", error);
			toast({
				title: "一括更新エラー",
				description: "一括更新に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 更新可能かどうかの判定
	const canUpdate = amountGroups.some(
		(group) => group.selectedReturnItemIds.length > 0 || group.status !== "PENDING",
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Settings className="mr-2 h-4 w-4" />
						一括変更
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						返礼記録の一括変更（金額ベース）
					</DialogTitle>
					<DialogDescription>金額ごとに返礼品とステータスを一括で設定できます。</DialogDescription>
				</DialogHeader>

				{isLoadingData ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center space-y-2">
							<Loader2 className="h-8 w-8 animate-spin mx-auto" />
							<p className="text-sm text-muted-foreground">データを読み込み中...</p>
						</div>
					</div>
				) : (
					<BulkUpdateTable
						amountGroups={amountGroups}
						availableReturnItems={availableReturnItems}
						onUpdateGroups={setAmountGroups}
						disabled={isLoading}
					/>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
						キャンセル
					</Button>
					<Button
						onClick={handleExecuteUpdate}
						disabled={!canUpdate || isLoading || isLoadingData}
						className="min-w-[120px]"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								更新中...
							</>
						) : (
							"一括更新"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
