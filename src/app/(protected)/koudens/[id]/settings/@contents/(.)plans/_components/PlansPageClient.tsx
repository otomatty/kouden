"use client";

import { useState } from "react";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import PlanCard, { type Plan } from "@/components/custom/PlanCard";

interface PlansPageClientProps {
	id: string;
	plans: Plan[];
	/** 現在のプラン */
	currentPlan: Plan;
}

export default function PlansPageClient({ id, plans, currentPlan }: PlansPageClientProps) {
	const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [expectedCount, setExpectedCount] = useState<number | undefined>(undefined);

	const handlePurchase = async (planCode: string) => {
		setError(null);
		setLoadingPlan(planCode);
		try {
			const result = await purchaseKouden({
				koudenId: id,
				planCode,
				expectedCount: planCode === "premium_full_support" ? expectedCount : undefined,
				cancelPath: `/koudens/${id}/settings/plans`,
			});
			if (result.error) {
				setError(result.error);
				setLoadingPlan(null);
				return;
			}
			if (result.url) {
				window.location.href = result.url;
			}
		} catch (e) {
			console.error("[ERROR] 購入エラー:", e);
			setError("購入処理中にエラーが発生しました");
			setLoadingPlan(null);
		}
	};

	return (
		<>
			<div className="py-8">
				<h1 className="text-2xl font-bold mb-6">プランを選択</h1>
				{error && <p className="text-red-600 mb-4">{error}</p>}
				<div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6">
					{plans.map((plan) => (
						<PlanCard
							key={plan.id}
							plan={plan}
							currentPlan={currentPlan}
							expectedCount={expectedCount}
							onExpectedCountChange={setExpectedCount}
							loadingPlan={loadingPlan}
							onPurchase={handlePurchase}
						/>
					))}
				</div>
			</div>
		</>
	);
}
