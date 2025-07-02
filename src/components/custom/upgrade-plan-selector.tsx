"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanSelector } from "@/components/custom/plan-selector";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import type { Plan } from "@/types/plan-selector";

interface UpgradePlanSelectorProps {
	/** 香典帳ID */
	koudenId: string;
	/** 選択可能なプラン一覧 */
	plans: Plan[];
	/** 現在のプラン */
	currentPlan: Plan;
	/** キャンセル時のリダイレクトパス */
	cancelPath?: string;
}

/**
 * アップグレード用のプラン選択コンポーネント
 * 現在のプランとの比較表示とアップグレード処理を行う
 */
export function UpgradePlanSelector({
	koudenId,
	plans,
	currentPlan,
	cancelPath,
}: UpgradePlanSelectorProps) {
	const [selectedPlanCode, setSelectedPlanCode] = useState<string>("");
	const [expectedCount, setExpectedCount] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);
	const canPurchase = selectedPlan && selectedPlan.code !== currentPlan.code;

	const handlePurchase = async () => {
		if (!canPurchase) return;

		setError(null);
		setLoading(true);

		try {
			const result = await purchaseKouden({
				koudenId,
				planCode: selectedPlan.code,
				expectedCount: selectedPlan.code === "premium_full_support" ? expectedCount : undefined,
				cancelPath: cancelPath || `/purchase/${koudenId}`,
			});

			if (result.error) {
				setError(result.error);
				return;
			}

			if (result.url) {
				window.location.href = result.url;
			} else {
				setError("購入URLが取得できませんでした");
			}
		} catch (e) {
			console.error("[ERROR] 購入エラー:", e);
			setError("購入処理中にエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* エラー表示 */}
			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-600 text-sm">{error}</p>
				</div>
			)}

			{/* プラン選択 */}
			<PlanSelector
				plans={plans}
				selectedPlan={selectedPlanCode}
				expectedCount={expectedCount}
				currentPlan={currentPlan}
				mode="upgrade"
				onPlanChange={setSelectedPlanCode}
				onExpectedCountChange={setExpectedCount}
				loading={loading}
				disabled={loading}
			/>

			{/* 購入ボタン */}
			{canPurchase && (
				<div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
					<div className="space-y-1">
						<h3 className="font-semibold text-lg">{selectedPlan.name}にアップグレード</h3>
						<p className="text-sm text-gray-600">
							現在の{currentPlan.name}から{selectedPlan.name}にアップグレードします
						</p>
						{selectedPlan.code === "premium_full_support" && expectedCount > 0 && (
							<div className="text-sm text-gray-500 space-y-1">
								<p>※予想件数: {expectedCount}件</p>
								<p>※入力代行は予想件数以内のみとなります</p>
								<p>※予想件数よりも入力件数が少ない場合でも返金はできません</p>
							</div>
						)}
					</div>

					<div className="flex-shrink-0">
						<Button
							onClick={handlePurchase}
							disabled={loading || !canPurchase}
							size="lg"
							className="w-full sm:w-auto"
						>
							{loading ? "処理中..." : "このプランを購入する"}
						</Button>
					</div>
				</div>
			)}

			{/* 選択がない場合のメッセージ */}
			{!selectedPlanCode && (
				<div className="text-center py-8">
					<p className="text-gray-500">アップグレードしたいプランを選択してください</p>
				</div>
			)}

			{/* 現在のプランが選択された場合のメッセージ */}
			{selectedPlanCode === currentPlan.code && (
				<div className="text-center py-8">
					<p className="text-gray-500">これは現在ご利用中のプランです</p>
				</div>
			)}
		</div>
	);
}
