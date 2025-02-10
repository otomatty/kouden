import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryMethodsTable } from "./_components/table/table";
import { DeliveryMethodsToolbar } from "./_components/table/toolbar";

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
		<div className="container mx-auto py-6 space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">配送方法設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の配送方法を管理します</p>
			</div>

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
