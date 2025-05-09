import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryMethodsTable } from "./_components/table/table";
import { DeliveryMethodsToolbar } from "./_components/table/toolbar";
import { SettingsHeader } from "../../_components/settings-header";

interface DeliveryMethodsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 配送方法設定ページ
 * - 香典帳の配送方法の表示・編集
 * - 配送方法の追加、編集、削除の管理
 */
export default async function DeliveryMethodsPage({ params }: DeliveryMethodsPageProps) {
	const { id: koudenId } = await params;

	return (
		<div className="space-y-6">
			<SettingsHeader title="配送方法" description="返礼品の配送方法を管理します" />
			<Card>
				<CardHeader>
					<CardTitle>配送方法一覧</CardTitle>
					<CardDescription>配送方法の追加、編集、削除ができます</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<DeliveryMethodsTable koudenId={koudenId} deliveryMethods={[]} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
