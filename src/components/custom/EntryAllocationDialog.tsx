"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Calculator, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { getEntryOfferingAllocations } from "@/app/_actions/offerings/queries";
import type { OfferingAllocation } from "@/types/entries";

interface EntryAllocationDialogProps {
	entryId: string;
	entryName: string;
	koudenAmount: number;
	offeringTotal: number;
	children: React.ReactNode;
}

interface AllocationWithOffering extends OfferingAllocation {
	offering_type: string;
	offering_price: number;
	provider_name: string;
}

/**
 * 香典エントリーに配分されたお供物の詳細を表示するダイアログ
 */
export function EntryAllocationDialog({
	entryId,
	entryName,
	koudenAmount,
	offeringTotal,
	children,
}: EntryAllocationDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [allocations, setAllocations] = useState<AllocationWithOffering[]>([]);

	// 配分データを読み込み
	useEffect(() => {
		if (open) {
			loadAllocations();
		}
	}, [open]);

	const loadAllocations = async () => {
		setLoading(true);
		try {
			const result = await getEntryOfferingAllocations(entryId);
			if (result.success && result.data) {
				setAllocations(result.data);
			} else {
				toast.error(result.error || "配分データの取得に失敗しました");
			}
		} catch (error) {
			console.error("配分データ取得エラー:", error);
			toast.error("配分データの取得中にエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

	const getOfferingTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			FLOWER: "供花",
			FOOD: "供物",
			INCENSE: "線香",
			MONEY: "御供物料",
			OTHER: "その他",
		};
		return labels[type] || type;
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						{entryName} の配分詳細
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* サマリー情報 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">金額サマリー</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<span>香典金額:</span>
								<span className="font-medium">{formatCurrency(koudenAmount)}</span>
							</div>
							<div className="flex justify-between">
								<span>お供物配分:</span>
								<span className="font-medium">{formatCurrency(offeringTotal)}</span>
							</div>
							<Separator />
							<div className="flex justify-between">
								<span className="font-medium">合計金額:</span>
								<span className="font-medium text-lg">
									{formatCurrency(koudenAmount + offeringTotal)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* 配分されたお供物一覧 */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-medium">配分されたお供物</h3>
							<Badge variant="secondary">{allocations.length}件</Badge>
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-muted-foreground">読み込み中...</div>
							</div>
						) : allocations.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								配分されたお供物はありません
							</div>
						) : (
							<div className="space-y-3">
								{allocations.map((allocation) => (
									<Card key={allocation.id} className="border-l-4 border-l-blue-200">
										<CardContent className="p-4">
											<div className="space-y-3">
												<div className="flex items-start justify-between">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<Badge variant="outline">
																{getOfferingTypeLabel(allocation.offering_type)}
															</Badge>
															{allocation.is_primary_contributor && (
																<Badge variant="secondary" className="text-xs">
																	主要提供者
																</Badge>
															)}
														</div>
														<div className="font-medium">{allocation.provider_name}</div>
													</div>
													<div className="text-right">
														<div className="font-medium text-lg">
															{formatCurrency(allocation.allocated_amount)}
														</div>
														<div className="text-sm text-muted-foreground">
															{(allocation.allocation_ratio * 100).toFixed(1)}%
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4 text-sm">
													<div>
														<span className="text-muted-foreground">お供物総額:</span>
														<span className="ml-2 font-medium">
															{formatCurrency(allocation.offering_price)}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">配分率:</span>
														<span className="ml-2 font-medium">
															{(allocation.allocation_ratio * 100).toFixed(1)}%
														</span>
													</div>
												</div>

												{allocation.contribution_notes && (
													<div className="text-sm">
														<span className="text-muted-foreground">備考:</span>
														<span className="ml-2">{allocation.contribution_notes}</span>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>

					<Separator />

					{/* アクションボタン */}
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => setOpen(false)}>
							閉じる
						</Button>
						<Button variant="outline">
							<ExternalLink className="h-4 w-4 mr-2" />
							お供物一覧で確認
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
