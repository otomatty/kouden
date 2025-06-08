import type { Metadata } from "next";
import { getPlans } from "@/app/_actions/plans";
import { getKoudenWithPlan } from "@/app/_actions/koudens";
import PlansPageClient from "./_components/PlansPageClient";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { notFound } from "next/navigation";

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

	const [plansResult, planInfo] = await Promise.all([getPlans(), getKoudenWithPlan(koudenId)]);

	const { plans, error } = plansResult;
	if (error || !plans) {
		throw new Error(error || "プランの取得に失敗しました");
	}

	const currentPlan = planInfo.plan;

	return <PlansPageClient id={koudenId} plans={plans} currentPlan={currentPlan} />;
}
