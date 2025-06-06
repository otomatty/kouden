"use client";

import { useState } from "react";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import type { Database } from "@/types/supabase";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { calcSupportFee } from "@/utils/calcSupportFee";
import type { KoudenPermission } from "@/types/role";
import KoudenHeader from "../../_components/_common/KoudenHeader";
import ExpectedCountInput from "@/components/ui/ExpectedCountInput";

// Supabaseから取得するプラン型
type Plan = Database["public"]["Tables"]["plans"]["Row"];

interface PurchasePageClientProps {
	id: string;
	plans: Plan[];
	/** 現在のプラン */
	currentPlan: Plan;
}

export default function PurchasePageClient({ id, plans, currentPlan }: PurchasePageClientProps) {
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
				cancelPath: `/koudens/${id}/purchase`,
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
					{plans.map((plan) => {
						const isCurrent = plan.code === currentPlan.code;
						const isUpgradable = plan.price > currentPlan.price;
						const displayPrice =
							plan.code === "premium_full_support" && isUpgradable
								? calcSupportFee(expectedCount ?? 0, plan.price)
								: plan.price;
						return (
							<Card
								key={plan.id}
								className={cn("relative flex flex-col p-2", isCurrent && "border-2 border-primary")}
							>
								{isCurrent && (
									<span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm font-semibold text-primary border-2 border-primary rounded-full">
										現在のプラン
									</span>
								)}
								<CardHeader>
									<CardTitle>{plan.name}</CardTitle>
									<CardDescription>{plan.description}</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<p className="text-xl font-semibold">{displayPrice.toLocaleString()}円</p>
									<ul className="list-disc list-inside mt-2 space-y-1">
										{plan.features?.map((feat: string) => (
											<li key={feat}>{feat}</li>
										))}
									</ul>
									{plan.code === "premium_full_support" && isUpgradable && (
										<ExpectedCountInput
											id={`expectedCount-${plan.id}`}
											value={expectedCount ?? 0}
											onChange={setExpectedCount}
										/>
									)}
								</CardContent>
								<CardFooter>
									{isCurrent ? null : (
										<Button
											className="w-full"
											disabled={loadingPlan === plan.code || !isUpgradable}
											onClick={() => handlePurchase(plan.code)}
										>
											{loadingPlan === plan.code ? "処理中..." : "このプランを購入する"}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>
		</>
	);
}
