// Server Actions
import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { ClientProviders } from "@/components/providers/client-providers";
import type { Metadata } from "next";

import { BottomNavigation } from "@/app/(protected)/koudens/[id]/_components/_common/bottom-navigation";
// components
import { notFound, redirect } from "next/navigation";
import { KoudenHeader } from "./_components/_common/kouden-header";
import { TabNavigation } from "./_components/_common/tab-navigation";
import ArchivedPage from "./archived/page";

/**
 * 動的ルートのメタデータを生成する
 * @param params.id - 香典帳ID
 */
export async function generateMetadata({
	params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id: koudenId } = await params;
	const result = await getKouden(koudenId);
	if (!result.ok) {
		// データ取得エラー時は一覧にリダイレクト
		redirect("/koudens");
	}
	const kouden = result.data;
	return {
		title: `${kouden.title} | 香典帳`,
		description: kouden.description || "香典帳詳細",
	};
}

interface KoudenLayoutProps {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}

/**
 * 香典帳詳細ページのレイアウトコンポーネント
 * @param params.id - 香典帳ID
 * @param children - 子コンポーネント
 */
export default async function KoudenLayout({ params, children }: KoudenLayoutProps) {
	const { id: koudenId } = await params;

	try {
		const permission = await checkKoudenPermission(koudenId);
		// 共通で使用するデータとプラン情報を取得
		const [koudenResult, planInfoResult] = await Promise.all([
			getKouden(koudenId),
			getKoudenWithPlan(koudenId),
		]);
		if (!koudenResult.ok) {
			if (koudenResult.error.code === "NOT_FOUND") notFound();
			throw new Error(koudenResult.error.message);
		}
		if (!planInfoResult.ok) {
			if (planInfoResult.error.code === "NOT_FOUND") notFound();
			throw new Error(planInfoResult.error.message);
		}
		const kouden = koudenResult.data;
		const planInfo = planInfoResult.data;
		const { plan, expired, remainingDays } = planInfo;
		// Excel出力は有料プランかつ期限切れでない場合のみ有効
		const enableExcel = plan.code !== "free" && !expired;
		// CSV出力もExcel出力と同じ制限を適用
		const enableCsv = plan.code !== "free" && !expired;

		if (kouden.status === "archived") {
			return <ArchivedPage params={params} />;
		}

		return (
			<ClientProviders permission={permission}>
				<div className="flex h-full flex-col">
					<div className="flex-1 overflow-hidden">
						<div>
							<KoudenHeader
								koudenId={kouden.id}
								title={kouden.title}
								description={kouden.description}
								permission={permission}
								enableExcel={enableExcel}
								enableCsv={enableCsv}
								remainingDays={remainingDays}
								plan={plan}
								expired={expired}
							/>
							{/* タブナビゲーション */}
							<TabNavigation koudenId={kouden.id} />
							<div className="mb-4 min-h-[calc(100vh-10rem)] lg:pb-16">{children}</div>
						</div>
					</div>
				</div>
				<BottomNavigation id={kouden.id} />
			</ClientProviders>
		);
	} catch {
		// エラー発生時は一覧ページへリダイレクト
		redirect("/koudens");
	}
}
