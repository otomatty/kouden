import { getPlans } from "@/app/_actions/plans";
import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens";
import { UpgradePlanSelector } from "@/components/custom/upgrade-plan-selector";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { notFound } from "next/navigation";

interface PurchasePageProps {
	params: Promise<{ id: string }>;
}

export default async function PurchasePage({ params }: PurchasePageProps) {
	const { id: koudenId } = await params;
	try {
		await checkKoudenPermission(koudenId);
	} catch {
		notFound();
	}
	const [kouden, plansResult, planInfo] = await Promise.all([
		getKouden(koudenId),
		getPlans(),
		getKoudenWithPlan(koudenId),
	]);
	if (!kouden) {
		notFound();
	}
	const { plans, error } = plansResult;
	if (error || !plans) {
		throw new Error(error || "プランの取得に失敗しました");
	}
	const currentPlan = planInfo.plan;

	return (
		<div className="py-8">
			<h1 className="text-2xl font-bold mb-6">プランを選択</h1>
			<UpgradePlanSelector
				koudenId={koudenId}
				plans={plans}
				currentPlan={currentPlan}
				cancelPath={`/purchase/${koudenId}`}
			/>
		</div>
	);
}
