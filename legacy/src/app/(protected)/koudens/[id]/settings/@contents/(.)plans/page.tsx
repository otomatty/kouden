import { getKoudenWithPlan } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { getPlans } from "@/app/_actions/plans";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlansPageClient } from "./_components/plans-page-client";

interface PlansPageProps {
	params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
	title: "プラン管理 - 香典帳アプリ",
	description: "プランをアップグレードして香典帳の機能を拡張します",
};

export default async function PlansPage({ params }: PlansPageProps) {
	const { id: koudenId } = await params;

	try {
		await checkKoudenPermission(koudenId);
	} catch {
		notFound();
	}

	const [plansResult, planInfoResult] = await Promise.all([
		getPlans(),
		getKoudenWithPlan(koudenId),
	]);

	if (!plansResult.ok) {
		throw new Error(plansResult.error.message);
	}
	if (!planInfoResult.ok) {
		throw new Error(planInfoResult.error.message);
	}
	const plans = plansResult.data;
	const currentPlan = planInfoResult.data.plan;

	return <PlansPageClient id={koudenId} plans={plans} currentPlan={currentPlan} />;
}
