"use client";

import React from "react";
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
import ExpectedCountInput from "@/components/ui/ExpectedCountInput";
import { calcSupportFee } from "@/utils/calcSupportFee";

// Supabaseから取得するプラン型
export type Plan = Database["public"]["Tables"]["plans"]["Row"];

/**
 * プラン情報をカード形式で表示し、アップグレード処理を行うコンポーネント
 */
export interface PlanCardProps {
	plan: Plan;
	currentPlan: Plan;
	/** premium_full_support 時に必要な予想人数 */
	expectedCount?: number;
	/** 予想人数の変更ハンドラ */
	onExpectedCountChange?: (value: number) => void;
	/** 現在処理中のプランコード */
	loadingPlan: string | null;
	/** 購入ボタン押下時のハンドラ */
	onPurchase: (planCode: string) => void;
}

export default function PlanCard({
	plan,
	currentPlan,
	expectedCount = 0,
	onExpectedCountChange,
	loadingPlan,
	onPurchase,
}: PlanCardProps) {
	const isCurrent = plan.code === currentPlan.code;
	const isUpgradable = plan.price > currentPlan.price;
	const displayPrice =
		plan.code === "premium_full_support" && isUpgradable
			? calcSupportFee(expectedCount, plan.price)
			: plan.price;

	return (
		<Card className={cn("relative flex flex-col p-2", isCurrent && "border-2 border-primary")}>
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
				{plan.code === "premium_full_support" && isUpgradable && onExpectedCountChange && (
					<ExpectedCountInput
						id={`expectedCount-${plan.id}`}
						value={expectedCount}
						onChange={onExpectedCountChange}
					/>
				)}
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				{!isCurrent && (
					<>
						{plan.code === "premium_full_support" && isUpgradable && (
							<>
								<p className="text-sm text-gray-500 mb-2">※予想件数を入力してください。</p>
								<p className="text-sm text-gray-500 mb-2">
									※入力代行は予想件数以内のみとなります。
								</p>
								<p className="text-sm text-gray-500 mb-2">
									※予想件数よりも入力件数が少ない場合でも返金はできません。
								</p>
							</>
						)}
						<Button
							className="w-full"
							disabled={loadingPlan === plan.code || !isUpgradable}
							onClick={() => onPurchase(plan.code)}
						>
							{loadingPlan === plan.code ? "処理中..." : "このプランを購入する"}
						</Button>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
