import type { Metadata } from "next";
import Link from "next/link";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { PermissionProvider } from "@/components/providers/permission-provider";

// ui
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Server Actions
import { getKouden } from "@/app/_actions/koudens";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";
// components
import { KoudenTitle } from "./_components/_common/kouden-title";
import { KoudenActionsMenu } from "./_components/actions/kouden-actions-menu";
import { MobileMenuWrapper } from "./_components/_common/mobile-menu-wrapper";

// store

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

interface KoudenLayoutProps {
	params: Promise<{ id: string }>;
	tabs: React.ReactNode;
}

/**
 * 香典帳詳細ページのレイアウトコンポーネント
 * @param params.id - 香典帳ID
 * @param tabs - タブコンテンツ
 */
export default async function KoudenLayout({ params, tabs }: KoudenLayoutProps) {
	const { id: koudenId } = await params;
	const permission = await checkKoudenPermission(koudenId);
	// 共通で使用するデータを取得
	const [kouden, entriesData, relationshipsData] = await Promise.all([
		getKouden(koudenId),
		getEntries(koudenId),
		getRelationships(koudenId),
	]);

	return (
		<PermissionProvider permission={permission}>
			<div className="flex h-full flex-col">
				<div className="flex-1 overflow-hidden">
					<div className="space-y-4">
						{/* ヘッダー */}
						<div className="space-y-4 py-4">
							<Button variant="ghost" className="flex items-center gap-2 w-fit" asChild>
								<Link href="/koudens">
									<ArrowLeft className="h-4 w-4" />
									<span>一覧に戻る</span>
								</Link>
							</Button>
							<div className="flex items-center justify-between">
								<KoudenTitle
									koudenId={kouden.id}
									title={kouden.title}
									description={kouden.description}
								/>
								<KoudenActionsMenu koudenId={kouden.id} koudenTitle={kouden.title} />
							</div>
						</div>

						{tabs}

						{/* モバイルメニュー */}
						<MobileMenuWrapper
							koudenId={kouden.id}
							entries={entriesData}
							relationships={relationshipsData}
						/>
					</div>
				</div>
			</div>
		</PermissionProvider>
	);
}
