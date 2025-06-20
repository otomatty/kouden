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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Users, Calculator } from "lucide-react";
import { toast } from "sonner";

import {
	allocateOfferingToEntries,
	recalculateOfferingAllocation,
} from "@/app/_actions/offerings/allocation";
import {
	getOfferingAllocations,
	checkOfferingAllocationIntegrity,
} from "@/app/_actions/offerings/queries";
import type { OfferingAllocation, OfferingAllocationRequest } from "@/types/entries";

interface OfferingAllocationDialogProps {
	offeringId: string;
	offeringType: string;
	offeringPrice: number;
	providerName?: string;
	availableEntries: Array<{
		id: string;
		name: string;
		amount: number;
		organization?: string;
	}>;
	children: React.ReactNode;
}

export function OfferingAllocationDialog({
	offeringId,
	offeringType,
	offeringPrice,
	providerName,
	availableEntries,
	children,
}: OfferingAllocationDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [allocations, setAllocations] = useState<OfferingAllocation[]>([]);
	const [allocationMethod, setAllocationMethod] = useState<"equal" | "weighted" | "manual">(
		"equal",
	);
	const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
	const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
	const [primaryContributor, setPrimaryContributor] = useState<string>("");
	const [integrity, setIntegrity] = useState<{
		isValid: boolean;
		difference: number;
		ratioSum: number;
	} | null>(null);

	// 既存の配分データを読み込み
	useEffect(() => {
		if (open) {
			loadAllocations();
		}
	}, [open]);

	const loadAllocations = async () => {
		const result = await getOfferingAllocations(offeringId);
		if (result.success && result.data) {
			setAllocations(result.data);
			setSelectedEntries(
				result.data.map((a) => a.kouden_entry_id).filter((id): id is string => id !== null),
			);
			setPrimaryContributor(
				result.data.find((a) => a.is_primary_contributor)?.kouden_entry_id || "",
			);
		}
		await checkIntegrity();
	};

	const checkIntegrity = async () => {
		const result = await checkOfferingAllocationIntegrity(offeringId);
		if (result.success && result.data && result.data.length > 0) {
			const data = result.data[0];
			setIntegrity({
				isValid: data?.is_valid ?? false,
				difference: data?.allocation_difference ?? 0,
				ratioSum: data?.ratio_sum ?? 0,
			});
		}
	};

	const handleSaveAllocation = async () => {
		if (selectedEntries.length === 0) {
			toast.error("香典エントリーを選択してください");
			return;
		}

		setLoading(true);

		try {
			const request: OfferingAllocationRequest = {
				offering_id: offeringId,
				kouden_entry_ids: selectedEntries,
				allocation_method: allocationMethod,
				manual_amounts:
					allocationMethod === "manual"
						? selectedEntries.map((id) => Number(manualAmounts[id]) || 0)
						: undefined,
				primary_contributor_id: primaryContributor || selectedEntries[0],
			};

			const result = await allocateOfferingToEntries(request);

			if (result.success) {
				toast.success("お供物の配分を保存しました");
				await loadAllocations();
			} else {
				toast.error(result.error || "配分の保存に失敗しました");
			}
		} catch (error) {
			console.error("配分保存エラー:", error);
			toast.error("配分の保存中にエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	const handleRecalculate = async () => {
		setLoading(true);
		try {
			const manualAmountsArray =
				allocationMethod === "manual"
					? selectedEntries.map((id) => Number(manualAmounts[id]) || 0)
					: undefined;

			const result = await recalculateOfferingAllocation(
				offeringId,
				allocationMethod,
				manualAmountsArray,
			);

			if (result.success) {
				toast.success("配分を再計算しました");
				await loadAllocations();
			} else {
				toast.error(result.error || "再計算に失敗しました");
			}
		} catch (error) {
			console.error("再計算エラー:", error);
			toast.error("再計算中にエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	const getEntryDisplayName = (entryId: string) => {
		const entry = availableEntries.find((e) => e.id === entryId);
		return entry ? `${entry.name}${entry.organization ? ` (${entry.organization})` : ""}` : entryId;
	};

	const calculateExpectedAmount = (entryId: string): number => {
		if (allocationMethod === "manual") {
			return Number(manualAmounts[entryId]) || 0;
		}
		// 均等配分の場合
		const entryCount = selectedEntries.length;
		const baseAmount = Math.floor(offeringPrice / entryCount);
		const remainder = offeringPrice % entryCount;
		const index = selectedEntries.indexOf(entryId);
		return baseAmount + (index < remainder ? 1 : 0);
	};

	const manualTotal = selectedEntries.reduce(
		(sum, entryId) => sum + (Number(manualAmounts[entryId]) || 0),
		0,
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						お供物の配分管理
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* お供物情報 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">お供物情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<span>種類:</span>
								<span className="font-medium">{offeringType}</span>
							</div>
							<div className="flex justify-between">
								<span>金額:</span>
								<span className="font-medium text-lg">¥{offeringPrice.toLocaleString()}</span>
							</div>
							{providerName && (
								<div className="flex justify-between">
									<span>提供者:</span>
									<span className="font-medium">{providerName}</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 整合性チェック */}
					{integrity && (
						<Card className={integrity.isValid ? "border-green-200" : "border-red-200"}>
							<CardContent className="pt-4">
								<div className="flex items-center gap-2">
									{integrity.isValid ? (
										<CheckCircle className="h-5 w-5 text-green-600" />
									) : (
										<AlertTriangle className="h-5 w-5 text-red-600" />
									)}
									<span className={integrity.isValid ? "text-green-700" : "text-red-700"}>
										{integrity.isValid ? "配分は正常です" : "配分に問題があります"}
									</span>
								</div>
								{!integrity.isValid && (
									<div className="mt-2 text-sm text-gray-600">
										<div>差額: ¥{Math.abs(integrity.difference)}</div>
										<div>比率合計: {(integrity.ratioSum * 100).toFixed(2)}%</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* 配分方法選択 */}
					<div className="space-y-4">
						<Label htmlFor="allocation-method">配分方法</Label>
						<Select
							value={allocationMethod}
							onValueChange={(value: "equal" | "weighted" | "manual") => setAllocationMethod(value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="equal">均等配分</SelectItem>
								<SelectItem value="weighted">重み付け配分（準備中）</SelectItem>
								<SelectItem value="manual">手動配分</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* 香典エントリー選択 */}
					<div className="space-y-4">
						<Label>関連する香典エントリー</Label>
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{availableEntries.map((entry) => (
								<Card
									key={entry.id}
									className={`cursor-pointer transition-colors ${
										selectedEntries.includes(entry.id)
											? "border-blue-300 bg-blue-50"
											: "border-gray-200"
									}`}
									onClick={() => {
										setSelectedEntries((prev) =>
											prev.includes(entry.id)
												? prev.filter((id) => id !== entry.id)
												: [...prev, entry.id],
										);
									}}
								>
									<CardContent className="p-3">
										<div className="flex justify-between items-center">
											<div>
												<div className="font-medium">{entry.name}</div>
												{entry.organization && (
													<div className="text-sm text-gray-500">{entry.organization}</div>
												)}
											</div>
											<div className="text-right">
												<div className="font-medium">¥{entry.amount.toLocaleString()}</div>
												{selectedEntries.includes(entry.id) && (
													<Badge variant="secondary" className="text-xs">
														配分: ¥{calculateExpectedAmount(entry.id).toLocaleString()}
													</Badge>
												)}
											</div>
										</div>
										{/* 手動配分の場合の入力フィールド */}
										{allocationMethod === "manual" && selectedEntries.includes(entry.id) && (
											<div
												className="mt-2"
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.stopPropagation();
													}
												}}
											>
												<Label htmlFor={`manual-${entry.id}`} className="text-xs">
													配分金額
												</Label>
												<Input
													id={`manual-${entry.id}`}
													type="number"
													placeholder="0"
													value={manualAmounts[entry.id] || ""}
													onChange={(e) =>
														setManualAmounts((prev) => ({
															...prev,
															[entry.id]: e.target.value,
														}))
													}
													className="h-8 text-sm"
												/>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</div>

					{/* 主要提供者選択 */}
					{selectedEntries.length > 1 && (
						<div className="space-y-2">
							<Label htmlFor="primary-contributor">主要提供者</Label>
							<Select value={primaryContributor} onValueChange={setPrimaryContributor}>
								<SelectTrigger>
									<SelectValue placeholder="主要提供者を選択" />
								</SelectTrigger>
								<SelectContent>
									{selectedEntries.map((entryId) => (
										<SelectItem key={entryId} value={entryId}>
											{getEntryDisplayName(entryId)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* 手動配分の合計チェック */}
					{allocationMethod === "manual" && selectedEntries.length > 0 && (
						<Card
							className={manualTotal === offeringPrice ? "border-green-200" : "border-orange-200"}
						>
							<CardContent className="pt-4">
								<div className="flex items-center justify-between">
									<span>手動配分合計:</span>
									<span
										className={`font-medium ${
											manualTotal === offeringPrice ? "text-green-700" : "text-orange-700"
										}`}
									>
										¥{manualTotal.toLocaleString()} / ¥{offeringPrice.toLocaleString()}
									</span>
								</div>
								{manualTotal !== offeringPrice && (
									<div className="text-sm text-orange-600 mt-1">
										差額: ¥{Math.abs(offeringPrice - manualTotal).toLocaleString()}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Separator />

					{/* アクションボタン */}
					<div className="flex gap-2 justify-end">
						{allocations.length > 0 && (
							<Button
								variant="outline"
								onClick={handleRecalculate}
								disabled={loading || selectedEntries.length === 0}
								className="flex items-center gap-2"
							>
								<Calculator className="h-4 w-4" />
								再計算
							</Button>
						)}
						<Button
							onClick={handleSaveAllocation}
							disabled={
								loading ||
								selectedEntries.length === 0 ||
								(allocationMethod === "manual" && manualTotal !== offeringPrice)
							}
						>
							{loading ? "保存中..." : allocations.length > 0 ? "更新" : "配分を作成"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
