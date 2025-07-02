"use client";

import { UpgradePlanSelector } from "@/components/custom/upgrade-plan-selector";
import type { Plan } from "@/types/plan-selector";

interface PlansPageClientProps {
	id: string;
	plans: Plan[];
	/** 現在のプラン */
	currentPlan: Plan;
}

export default function PlansPageClient({ id, plans, currentPlan }: PlansPageClientProps) {
	return (
		<div className="py-8">
			<h1 className="text-2xl font-bold mb-6">プランを選択</h1>
			<UpgradePlanSelector
				koudenId={id}
				plans={plans}
				currentPlan={currentPlan}
				cancelPath={`/koudens/${id}/settings`}
			/>
		</div>
	);
}
