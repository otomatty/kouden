import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneralSettingsForm } from "./_components/general-settings-form";

interface GeneralSettingsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 一般設定ページ
 * - 香典帳の基本情報の表示・編集
 * - タイトル、説明、その他の一般設定の管理
 */
export default async function GeneralSettingsPage({ params }: GeneralSettingsPageProps) {
	const { id: koudenId } = await params;

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">一般設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の基本的な設定を管理します</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>基本情報</CardTitle>
					<CardDescription>香典帳のタイトルや説明文を設定します</CardDescription>
				</CardHeader>
				<CardContent>
					<GeneralSettingsForm koudenId={koudenId} />
				</CardContent>
			</Card>
		</div>
	);
}
