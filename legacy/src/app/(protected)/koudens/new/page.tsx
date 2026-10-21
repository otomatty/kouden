import { getPlans } from "@/app/_actions/plans";
import { NewKoudenPlanSelector } from "@/components/custom/new-kouden-plan-selector";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
export const metadata: Metadata = {
	title: "新規香典帳作成",
	description: "香典帳の新規作成ページです",
};

export default async function NewKoudenPage() {
	const plansResult = await getPlans();
	if (!plansResult.ok) {
		throw new Error(plansResult.error.message);
	}
	const plans = plansResult.data;

	// 認証チェックのみ（userId はサーバーアクション側で auth.uid() から導出するため不要）
	const supabase = await createClient();
	const { data, error: userError } = await supabase.auth.getUser();
	if (userError || !data.user) {
		throw new Error("ユーザーが見つかりません");
	}

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">香典帳を作成する</h1>
			<NewKoudenPlanSelector plans={plans} />
		</div>
	);
}
