import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { getKoudenForAdmin } from "@/app/_actions/koudens/read";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Info, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface AdminSettingsPageProps {
	params: Promise<{ id: string }>;
}

export default async function AdminSettingsPage({ params }: AdminSettingsPageProps) {
	// 管理者権限チェック
	await checkAdminPermission();

	const { id: koudenId } = await params;
	const kouden = await getKoudenForAdmin(koudenId);

	if (!kouden) {
		throw new Error("香典帳が見つかりません");
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center gap-2 mb-6">
				<Settings className="h-6 w-6" />
				<h1 className="text-2xl font-bold">香典帳設定（管理者モード）</h1>
			</div>

			{/* 基本情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Info className="h-5 w-5" />
						基本情報
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground">香典帳名</label>
							<p className="text-lg font-semibold">{kouden.title}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">ステータス</label>
							<div className="mt-1">
								<Badge variant={kouden.status === "active" ? "default" : "secondary"}>
									{kouden.status === "active" ? "アクティブ" : "アーカイブ済み"}
								</Badge>
							</div>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">作成日</label>
							<p className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								{format(new Date(kouden.created_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">最終更新</label>
							<p className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								{format(new Date(kouden.updated_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
							</p>
						</div>
					</div>
					{kouden.description && (
						<div>
							<label className="text-sm font-medium text-muted-foreground">説明</label>
							<p className="mt-1 text-sm">{kouden.description}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 管理者向け情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						管理者向け情報
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm text-muted-foreground">
						<p>• 管理者として全ての機能にアクセス可能です</p>
						<p>• この香典帳の全ての記録、メンバー、設定を確認・編集できます</p>
						<p>• 通常のユーザー権限制限は適用されません</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
