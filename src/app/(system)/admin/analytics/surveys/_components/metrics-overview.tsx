"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Star, MessageSquare } from "lucide-react";

interface SurveyData {
	totalResponses: number;
	npsValue: number;
	averageNps: number;
	averageSatisfaction: number;
}

interface MetricsOverviewProps {
	data: SurveyData;
	pdfExportCount: number;
	oneWeekCount: number;
	feedbackCount: number;
}

/**
 * 満足度のスター表示
 */
function SatisfactionStars({ score }: { score: number }) {
	// スター配列をメモ化
	const stars = useMemo(
		() =>
			Array.from({ length: 5 }, (_, i) => ({
				id: `metrics-star-${i}`,
				filled: i < score,
			})),
		[score],
	);

	return (
		<div className="flex items-center gap-1">
			{stars.map((star) => (
				<Star
					key={star.id}
					className={`h-4 w-4 ${star.filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
				/>
			))}
			<span className="ml-1 text-sm text-muted-foreground">({score}/5)</span>
		</div>
	);
}

export function MetricsOverview({
	data,
	pdfExportCount,
	oneWeekCount,
	feedbackCount,
}: MetricsOverviewProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">総回答数</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data.totalResponses}</div>
					<p className="text-xs text-muted-foreground">
						PDF出力後: {pdfExportCount}件 / 1週間後: {oneWeekCount}件
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">NPS スコア</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data.npsValue}</div>
					<p className="text-xs text-muted-foreground">平均推奨度: {data.averageNps}/10</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">平均満足度</CardTitle>
					<Star className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data.averageSatisfaction}</div>
					<SatisfactionStars score={Math.round(data.averageSatisfaction)} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">フィードバック</CardTitle>
					<MessageSquare className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{feedbackCount}</div>
					<p className="text-xs text-muted-foreground">
						自由記述回答率: {Math.round((feedbackCount / data.totalResponses) * 100)}%
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
