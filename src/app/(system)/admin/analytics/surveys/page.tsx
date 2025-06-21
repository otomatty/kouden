import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getAdminSurveyAnalytics } from "@/app/_actions/user-surveys";
import { SurveyExportButtons } from "./_components/export-buttons";
import { MetricsOverview } from "./_components/metrics-overview";
import { NPSBreakdownCard } from "./_components/nps-breakdown";
import { SatisfactionDistribution } from "./_components/satisfaction-distribution";
import { FeatureRequests } from "./_components/feature-requests";
import { UsabilityImprovements } from "./_components/usability-improvements";
import { RecentFeedback } from "./_components/recent-feedback";
import { SurveyAnalyticsSkeleton } from "./_components/loading-skeleton";
import { ErrorDisplay } from "./_components/error-display";

export const metadata: Metadata = {
	title: "アンケート分析 | 管理画面",
	description: "ユーザーアンケートの分析結果を表示します",
};

async function SurveyAnalyticsDashboard() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// アンケート分析データを取得
	const analyticsResult = await getAdminSurveyAnalytics();

	if (!analyticsResult.success) {
		return <ErrorDisplay error={analyticsResult.error || "不明なエラー"} />;
	}

	if (!analyticsResult.data) {
		return <ErrorDisplay error="データが見つかりません" />;
	}

	const { data } = analyticsResult;
	const surveys = data.rawData;

	// トリガー別の分析
	const pdfExportSurveys = surveys.filter((s) => s.survey_trigger === "pdf_export");
	const oneWeekSurveys = surveys.filter((s) => s.survey_trigger === "one_week_usage");

	// 自由記述のあるアンケート
	const feedbackCount = surveys.filter((s) => s.additional_feedback?.trim()).length;

	return (
		<div className="space-y-6">
			{/* 概要メトリクス */}
			<MetricsOverview
				data={data}
				pdfExportCount={pdfExportSurveys.length}
				oneWeekCount={oneWeekSurveys.length}
				feedbackCount={feedbackCount}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* NPS分類 */}
				<NPSBreakdownCard
					npsBreakdown={data.npsBreakdown}
					npsValue={data.npsValue}
					totalResponses={data.totalResponses}
				/>

				{/* 満足度分布 */}
				<SatisfactionDistribution surveys={surveys} totalResponses={data.totalResponses} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* 機能要望ランキング */}
				<FeatureRequests surveys={surveys} totalResponses={data.totalResponses} />

				{/* 操作性改善要望 */}
				<UsabilityImprovements surveys={surveys} totalResponses={data.totalResponses} />
			</div>

			{/* 最近の自由記述フィードバック */}
			<RecentFeedback surveys={surveys} />
		</div>
	);
}

export default async function AdminSurveyAnalyticsPage() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">アンケート分析</h1>
				<div className="flex items-center gap-2">
					<SurveyExportButtons />
					<Badge variant="outline">リアルタイム更新</Badge>
				</div>
			</div>

			<Suspense fallback={<SurveyAnalyticsSkeleton />}>
				<SurveyAnalyticsDashboard />
			</Suspense>
		</div>
	);
}
