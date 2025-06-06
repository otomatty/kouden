import type { Metadata } from "next";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { PermissionProvider } from "@/components/providers/permission-provider";
// Server Actions
import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens";
// components
import { notFound } from "next/navigation";
import ArchivedPage from "./archived/page";
import KoudenHeader from "./_components/_common/KoudenHeader";
import TabNavigation from "./_components/_common/TabNavigation";

/**
 * 動的ルートのメタデータを生成する
 * @param params.id - 香典帳ID
 */
export async function generateMetadata({
	params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id: koudenId } = await params;
	const kouden = await getKouden(koudenId);
	if (!kouden) {
		notFound();
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
			<PermissionProvider permission={permission}>
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
							<div className="mb-4 min-h-[calc(100vh-10rem)]">{children}</div>
						</div>
					</div>
				</div>
			</PermissionProvider>
		);
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("香典帳の読み込み中にエラーが発生しました。");
	}
}
