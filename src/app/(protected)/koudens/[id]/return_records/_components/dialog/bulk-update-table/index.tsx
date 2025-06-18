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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, AlertTriangle } from "lucide-react";

// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { AmountGroupData, ReturnItemMaster } from "@/types/return-records/bulk-update";

// utils
import { groupRecordsByAmount } from "@/utils/bulk-update-helpers";

// actions
import {
	getReturnItemsForBulkUpdate,
	// 通常版
	// executeBulkUpdateMultipleGroups,
} from "@/app/_actions/return-records/bulk-update";
// 最適化版（超高速）
import { executeBulkUpdateOptimized } from "@/app/_actions/return-records/bulk-update-optimized";
import { getAllReturnRecordsForBulkUpdate } from "@/app/_actions/return-records/return-records";

// components
import { BulkUpdateTable } from "./bulk-update-table";
import { BulkUpdateLoadingScreen } from "@/components/custom/bulk-update-loading-screen";
import { returnRecordsBulkUpdateHints } from "@/store/loading-hints";

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
	const [lastUpdateErrors, setLastUpdateErrors] = useState<string[]>([]);

	// データ状態
	const [_allReturnRecords, setAllReturnRecords] = useState<ReturnManagementSummary[]>([]);
	const [amountGroups, setAmountGroups] = useState<AmountGroupData[]>([]);
	const [availableReturnItems, setAvailableReturnItems] = useState<ReturnItemMaster[]>([]);

	// ダイアログが開かれた時の初期化
	useEffect(() => {
		if (open) {
			const initializeData = async () => {
				setIsLoadingData(true);
				setLastUpdateErrors([]); // エラーをクリア
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
					const errorMessage =
						error instanceof Error ? error.message : "不明なエラーが発生しました";
					toast({
						title: "データ読み込みエラー",
						description: `データの取得に失敗しました: ${errorMessage}`,
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
			setLastUpdateErrors([]);
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
		setLastUpdateErrors([]); // 前回のエラーをクリア

		try {
			// 最適化版を使用（超高速）
			const result = await executeBulkUpdateOptimized(koudenId, groupsWithChanges);

			// 成功した場合
			if (result.successCount > 0) {
				toast({
					title: "一括更新完了",
					description: `${result.successCount}件の返礼記録を更新しました${
						result.failureCount > 0 ? ` (${result.failureCount}件失敗)` : ""
					}`,
				});

				// 親コンポーネントのデータ更新
				if (onBulkUpdate) {
					await onBulkUpdate({});
				}

				// エラーがなければダイアログを閉じる
				if (!result.errors || result.errors.length === 0) {
					setOpen(false);
				}
			}

			// エラーがある場合の処理
			if (result.errors && result.errors.length > 0) {
				setLastUpdateErrors(result.errors);

				if (result.failureCount > 0) {
					toast({
						title: "一部更新失敗",
						description: `${result.failureCount}件の更新に失敗しました。詳細はダイアログ内のエラー表示をご確認ください。`,
						variant: "destructive",
					});
				}
			}

			// 全て失敗した場合
			if (result.successCount === 0 && result.failureCount > 0) {
				toast({
					title: "一括更新失敗",
					description: "すべての更新に失敗しました。エラー詳細をご確認ください。",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("一括更新エラー:", error);
			const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";

			setLastUpdateErrors([`システムエラー: ${errorMessage}`]);

			toast({
				title: "一括更新エラー",
				description: `一括更新に失敗しました: ${errorMessage}`,
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

	// 処理対象件数を計算
	const totalProcessingCount = amountGroups
		.filter((group) => group.selectedReturnItemIds.length > 0 || group.status !== "PENDING")
		.reduce((sum, group) => sum + group.count, 0);

	return (
		<>
			{/* 一括更新中のローディング画面 */}
			<BulkUpdateLoadingScreen
				title="返礼記録を一括更新中"
				hints={returnRecordsBulkUpdateHints}
				isLoading={isLoading}
				totalCount={totalProcessingCount}
			/>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					{trigger || (
						<Button>
							<Settings className="mr-2 h-4 w-4" />
							一括変更
						</Button>
					)}
				</DialogTrigger>
				<DialogContent className="max-w-7xl h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>一括更新（テーブル形式）</DialogTitle>
						<DialogDescription>
							金額ごとにグループ化された返礼記録を一括で更新できます。
						</DialogDescription>
					</DialogHeader>

					{/* エラー表示 */}
					{lastUpdateErrors.length > 0 && (
						<Alert variant="destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
								<div className="space-y-1">
									<div className="font-medium">一括更新でエラーが発生しました：</div>
									<ul className="list-disc list-inside space-y-1 text-sm">
										{lastUpdateErrors.slice(0, 5).map((error) => (
											<li key={error}>{error}</li>
										))}
										{lastUpdateErrors.length > 5 && (
											<li className="text-muted-foreground">
												...他 {lastUpdateErrors.length - 5} 件のエラー
											</li>
										)}
									</ul>
								</div>
							</AlertDescription>
						</Alert>
					)}

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
		</>
	);
}
