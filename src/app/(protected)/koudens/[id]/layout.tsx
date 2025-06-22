import type { Metadata } from "next";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import ClientProviders from "@/components/providers/ClientProviders";
// Server Actions
import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens";

// components
import { notFound, redirect } from "next/navigation";
import ArchivedPage from "./archived/page";
import KoudenHeader from "./_components/_common/kouden-header";
import TabNavigation from "./_components/_common/tab-navigation";
import { BottomNavigation } from "@/components/custom/bottom-navigation";
import type { Kouden } from "@/types/kouden";

/**
 * 動的ルートのメタデータを生成する
 * @param params.id - 香典帳ID
 */
export async function generateMetadata({
	params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id: koudenId } = await params;
	let kouden: Kouden | null;
	try {
		kouden = await getKouden(koudenId);
	} catch {
		// データ取得エラー時は一覧にリダイレクト
		redirect("/koudens");
	}
	if (!kouden) {
		redirect("/koudens");
	}
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
		const [kouden, planInfo] = await Promise.all([
			getKouden(koudenId),
			getKoudenWithPlan(koudenId),
		]);
		const { plan, expired, remainingDays } = planInfo;
		// Excel出力は有料プランかつ期限切れでない場合のみ有効
		const enableExcel = plan.code !== "free" && !expired;

		// koudenが見つからない場合は404エラーを投げる
		if (!kouden) {
			notFound();
		}

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
								remainingDays={remainingDays}
							/>
							{/* タブナビゲーション */}
							<TabNavigation koudenId={kouden.id} />
							<div className="mb-4 min-h-[calc(100vh-10rem)] pb-16">{children}</div>
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
