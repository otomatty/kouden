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
	const [koudenResult, plansResult, planInfoResult] = await Promise.all([
		getKouden(koudenId),
		getPlans(),
		getKoudenWithPlan(koudenId),
	]);
	if (!koudenResult.ok) {
		notFound();
	}
	if (!plansResult.ok) {
		throw new Error(plansResult.error.message);
	}
	if (!planInfoResult.ok) {
		throw new Error(planInfoResult.error.message);
	}
	const plans = plansResult.data;
	const currentPlan = planInfoResult.data.plan;

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
