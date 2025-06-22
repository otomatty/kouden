import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTwoFactorEnabled } from "@/lib/security/two-factor-auth";

import { SummaryCard } from "./_components/dashboard/summary-card";
import { ServiceStatusTabs } from "./_components/dashboard/service-status-tabs";
import { SalesChart } from "./_components/dashboard/sales-chart";
import { ActivityChart } from "./_components/dashboard/activity-chart";
import { RecentInquiriesList } from "./_components/dashboard/recent-inquiries-list";
import { RecentErrorsList } from "./_components/dashboard/recent-errors-list";

import {
	getDashboardSummary,
	getServiceStatus,
	getSalesMetrics,
	getActivityMetrics,
	getRecentInquiries,
	getRecentErrors,
} from "@/app/_actions/admin/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
	title: "管理ダッシュボード | 香典帳",
	description: "香典帳の管理者向けダッシュボードです",
};

// Skeleton Components
function SummarySectionSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<SummaryCard title="未対応問い合わせ" value={0} isLoading />
			<SummaryCard title="システムエラー (24h)" value={0} isLoading />
			<div className="md:col-span-2 lg:col-span-1">
				<ServiceStatusTabs services={[]} isLoading />
			</div>
		</div>
	);
}

function MetricsSectionSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4">
			<SalesChart data={[]} isLoading />
			<ActivityChart data={[]} isLoading />
		</div>
	);
}

function DetailsSectionSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<RecentInquiriesList inquiries={[]} isLoading />
			<RecentErrorsList errors={[]} isLoading />
		</div>
	);
}


// Data Fetching Components
async function SummarySection() {
	const summaryData = await getDashboardSummary();
	const serviceStatusData = await getServiceStatus();
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<SummaryCard title="未対応問い合わせ" value={summaryData.openTicketsCount} />
			<SummaryCard title="システムエラー (24h)" value={summaryData.recentErrorsCount} />
			<div className="md:col-span-2 lg:col-span-1">
				<ServiceStatusTabs services={serviceStatusData} />
			</div>
		</div>
	);
}

async function MetricsSection() {
	const salesData = await getSalesMetrics("30d");
	const activityData = await getActivityMetrics("30d");
	return (
		<div className="grid grid-cols-1 gap-4">
			<SalesChart data={salesData} />
			<ActivityChart data={activityData} />
		</div>
	);
}

async function DetailsSection() {
	const inquiriesData = await getRecentInquiries(5);
	const errorsData = await getRecentErrors(5);
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<RecentInquiriesList inquiries={inquiriesData} />
			<RecentErrorsList errors={errorsData} />
		</div>
	);
}


export default async function AdminDashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// 2FA必須チェック
	// const twoFactorEnabled = await isTwoFactorEnabled(user.id);
	// if (!twoFactorEnabled) {
	//   redirect('/admin/settings/2fa/setup');
	// }

	return (
		<div className="container mx-auto space-y-6 p-4 sm:p-6 md:p-8">
			<h1 className="text-3xl font-bold tracking-tight">管理者ダッシュボード</h1>

			{/* Section A: Summary */}
			<section aria-labelledby="summary-section-title">
				<h2 id="summary-section-title" className="sr-only">サマリー</h2>
				<Suspense fallback={<SummarySectionSkeleton />}>
					<SummarySection />
				</Suspense>
			</section>

			{/* Section B: Business & Operational Metrics */}
			<section aria-labelledby="metrics-section-title">
				<h2 id="metrics-section-title" className="text-xl font-semibold tracking-tight mb-4">ビジネス・運用指標</h2>
				<Suspense fallback={<MetricsSectionSkeleton />}>
					<MetricsSection />
				</Suspense>
			</section>

			{/* Section C: Detailed Information */}
			<section aria-labelledby="details-section-title">
				<h2 id="details-section-title" className="text-xl font-semibold tracking-tight mb-4">詳細情報</h2>
				<Suspense fallback={<DetailsSectionSkeleton />}>
					<DetailsSection />
				</Suspense>
			</section>
		</div>
	);
}
