import type { Metadata } from "next";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import ClientProviders from "@/components/providers/ClientProviders";
import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens/read";
import { notFound } from "next/navigation";
import KoudenHeader from "../../koudens/[id]/_components/_common/kouden-header";

export const metadata: Metadata = {
	title: "プラン購入 - 香典帳アプリ",
	description: "プランを購入して香典帳の続きをご覧ください",
};

interface PurchaseLayoutProps {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}

/**
 * 購入ページ専用のレイアウトコンポーネント
 * アーカイブ状態でも表示可能
 */
export default async function PurchaseLayout({ params, children }: PurchaseLayoutProps) {
	const { id: koudenId } = await params;

	try {
		const permission = await checkKoudenPermission(koudenId);
		const [kouden, planInfo] = await Promise.all([
			getKouden(koudenId),
			getKoudenWithPlan(koudenId),
		]);
		const { plan, expired, remainingDays } = planInfo;
		const enableExcel = plan.code !== "free" && !expired;
		const enableCsv = plan.code !== "free" && !expired;

		if (!kouden) {
			notFound();
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
								fullAccess={false} // 購入ページでは制限表示
							/>
							<div className="mb-4 min-h-[calc(100vh-8rem)] p-4">{children}</div>
						</div>
					</div>
				</div>
			</ClientProviders>
		);
	} catch {
		notFound();
	}
}
