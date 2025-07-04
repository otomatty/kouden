import { Suspense, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactRequestsTable } from "./_components/contact-requests-table";
import { ContactRequestsStats } from "./_components/contact-requests-stats";
import { ContactRequestsFilters } from "./_components/contact-requests-filters";
import { CampaignApplicationsTable } from "./_components/campaign-applications-table";
import { CampaignApplicationsStats } from "./_components/campaign-applications-stats";
import { SupportTabs } from "./_components/support-tabs";

interface SupportPageProps {
	searchParams: Promise<{
		tab?: string;
		status?: string;
		category?: string;
		page?: string;
	}>;
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
	const { tab, page, status, category } = await searchParams;
	const activeTab = tab || "contact";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-gray-900">サポート管理</h1>
				<p className="text-gray-600 mt-1">お問い合わせとキャンペーン申し込みの管理</p>
			</div>

			<SupportTabs
				activeTab={activeTab}
				contactContent={
					<div className="space-y-6">
						{/* お問い合わせ統計情報 */}
						<Suspense fallback={<StatsLoadingSkeleton />}>
							<ContactRequestsStats />
						</Suspense>

						{/* お問い合わせフィルター */}
						<ContactRequestsFilters />

						{/* お問い合わせ一覧 */}
						<Card>
							<CardHeader>
								<CardTitle>お問い合わせ一覧</CardTitle>
							</CardHeader>
							<CardContent>
								<Suspense fallback={<TableLoadingSkeleton />}>
									<ContactRequestsTable
										status={status}
										category={category}
										page={Number(page) || 1}
									/>
								</Suspense>
							</CardContent>
						</Card>
					</div>
				}
				campaignContent={
					<div className="space-y-6">
						{/* キャンペーン申し込み統計情報 */}
						<Suspense fallback={<StatsLoadingSkeleton />}>
							<CampaignApplicationsStats />
						</Suspense>

						{/* キャンペーン申し込み一覧 */}
						<Card>
							<CardHeader>
								<CardTitle>キャンペーン申し込み一覧</CardTitle>
							</CardHeader>
							<CardContent>
								<Suspense fallback={<TableLoadingSkeleton />}>
									<CampaignApplicationsTable status={status} page={Number(page) || 1} />
								</Suspense>
							</CardContent>
						</Card>
					</div>
				}
			/>
		</div>
	);
}

function StatsLoadingSkeleton() {
	const skeletonItems = useMemo(
		() => Array.from({ length: 4 }, (_, i) => ({ id: `stats-skeleton-${i}` })),
		[],
	);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{skeletonItems.map((item) => (
				<Card key={item.id}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton className="h-4 w-[100px]" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-[60px]" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function TableLoadingSkeleton() {
	const skeletonRows = useMemo(
		() => Array.from({ length: 5 }, (_, i) => ({ id: `table-skeleton-${i}` })),
		[],
	);

	return (
		<div className="space-y-4">
			{skeletonRows.map((row) => (
				<div key={row.id} className="flex items-center space-x-4 p-4 border rounded-lg">
					<Skeleton className="h-4 w-[100px]" />
					<Skeleton className="h-4 w-[200px]" />
					<Skeleton className="h-4 w-[150px]" />
					<Skeleton className="h-4 w-[80px]" />
				</div>
			))}
		</div>
	);
}
