import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getKoudenForAdmin, getKoudenWithPlanForAdmin } from "@/app/_actions/koudens/read";
import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import KoudenHeader from "@/app/(protected)/koudens/[id]/_components/_common/KoudenHeader";
import TabNavigation from "@/app/(protected)/koudens/[id]/_components/_common/TabNavigation";
import type { Kouden } from "@/types/kouden";
import type { KoudenPermission } from "@/types/role";

/**
 * 管理者用香典帳詳細ページのメタデータを生成する
 * @param params.id - 香典帳ID
 */
export async function generateMetadata({
	params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id: koudenId } = await params;
	let kouden: Kouden | null;
	try {
		kouden = await getKoudenForAdmin(koudenId);
	} catch {
		redirect("/admin/users");
	}
	if (!kouden) {
		redirect("/admin/users");
	}
	return {
		title: `${kouden.title} | 管理者 - 香典帳詳細`,
		description: `管理者用: ${kouden.description || "香典帳詳細"}`,
	};
}

interface AdminKoudenLayoutProps {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}

/**
 * 管理者用香典帳詳細ページのレイアウトコンポーネント
 * @param params.id - 香典帳ID
 * @param children - 子コンポーネント
 */
export default async function AdminKoudenLayout({ params, children }: AdminKoudenLayoutProps) {
	const { id: koudenId } = await params;

	try {
		// 管理者権限チェック
		const { adminRole } = await checkAdminPermission();

		// 香典帳データとプラン情報を取得（管理者用関数を使用）
		const [kouden, planInfo] = await Promise.all([
			getKoudenForAdmin(koudenId),
			getKoudenWithPlanForAdmin(koudenId),
		]);

		if (!kouden) {
			notFound();
		}

		const { remainingDays } = planInfo;
		// 管理者は全ての機能にアクセス可能
		const enableExcel = true;

		// 管理者は最高権限のownerとして扱う
		const adminPermission: KoudenPermission = "owner";

		return (
			<div className="flex h-full flex-col">
				{/* 管理者用ヘッダー */}
				<div className="border-b bg-muted/30 px-4 py-3">
					<div className="flex items-center gap-4">
						<Button variant="outline" size="sm" asChild>
							<Link href="/admin/koudens">
								<ArrowLeft className="h-4 w-4 mr-2" />
								香典帳一覧に戻る
							</Link>
						</Button>
						<div>
							<h1 className="text-lg font-semibold">管理者モード - 香典帳詳細</h1>
							<p className="text-sm text-muted-foreground">
								管理者として香典帳の詳細を確認・管理できます（権限: {adminRole}）
							</p>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-hidden">
					<div>
						<KoudenHeader
							koudenId={kouden.id}
							title={kouden.title}
							description={kouden.description}
							permission={adminPermission}
							enableExcel={enableExcel}
							remainingDays={remainingDays}
						/>
						{/* タブナビゲーション */}
						<TabNavigation koudenId={kouden.id} />
						<div className="mb-4 min-h-[calc(100vh-12rem)] pb-4">{children}</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Admin kouden layout error:", error);

		// 権限エラーの場合は適切なメッセージを表示
		if (error instanceof Error && error.message.includes("管理者権限")) {
			console.warn("Access denied: User is not an admin");
			redirect("/admin/users?error=access_denied");
		}

		// その他のエラーの場合
		redirect("/admin/users?error=unknown");
	}
}
