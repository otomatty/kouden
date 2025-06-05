import type { Metadata } from "next";
import { getPlans } from "@/app/_actions/plans";
import { getKoudenWithPlan, getKouden } from "@/app/_actions/koudens";
import PurchasePageClient from "./_components/PurchasePageClient";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { notFound } from "next/navigation";
import type { KoudenPermission } from "@/types/role";

export const metadata: Metadata = {
	title: "プラン購入 - 香典帳アプリ",
	description: "プランを購入して香典帳の続きをご覧ください",
};

interface PurchasePageProps {
	params: Promise<{ id: string }>;
}

export default async function PurchasePage({ params }: PurchasePageProps) {
	const { id: koudenId } = await params;
	// 権限チェック
	let permission: KoudenPermission;
	try {
		permission = await checkKoudenPermission(koudenId);
	} catch {
		notFound();
	}
	// データ取得
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
	const { plan, expired } = planInfo;
	const enableExcel = plan.code !== "free" && !expired;
	return (
		<PurchasePageClient
			id={koudenId}
			plans={plans}
			currentPlan={currentPlan}
			title={kouden.title}
			description={kouden.description}
			permission={permission}
			enableExcel={enableExcel}
		/>
	);
}
