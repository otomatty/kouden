"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/currency";
import { memo } from "react";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
} from "recharts";

import type { ReturnStatus } from "@/components/ui/status-badge";
import { returnStatusMap, returnStatusCustomColors } from "@/components/ui/status-badge";

interface KoudenStatisticsProps {
	totalAmount: number;
	attendanceCounts: Record<"FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT", number>;
	returnStatusCounts?: Record<string, number>;
	returnProgressPercentage: number;
	completedCount?: number;
	amountDistribution: { name: string; count: number }[];
	attendanceData: { name: string; value: number; color: string }[];
	// Admin用の互換性のため
	returnProgress?: { completed: number; pending: number };
}

export const KoudenStatistics = memo(function KoudenStatistics({
	totalAmount,
	attendanceCounts,
	returnStatusCounts,
	returnProgressPercentage,
	completedCount,
	amountDistribution,
	attendanceData,
	returnProgress,
}: KoudenStatisticsProps) {
	// returnStatusCountsがない場合はreturnProgressから計算
	const defaultStatusCounts: Record<string, number> = returnProgress
		? {
				COMPLETED: returnProgress.completed,
				PENDING: returnProgress.pending,
			}
		: {};

	const actualStatusCounts: Record<string, number> = returnStatusCounts || defaultStatusCounts;
	const totalCount = Object.values(actualStatusCounts).reduce((sum, count) => sum + count, 0);
	const actualCompletedCount = completedCount ?? returnProgress?.completed ?? 0;

	// 返礼状況のセグメントデータを作成（順序: 完了系→未完了系）
	const statusOrder: ReturnStatus[] = ["COMPLETED", "NOT_REQUIRED", "PARTIAL_RETURNED", "PENDING"];
	const statusSegments = statusOrder
		.filter((status) => actualStatusCounts[status] && actualStatusCounts[status] > 0)
		.map((status) => {
			const count = actualStatusCounts[status] || 0;
			// PENDINGの場合はグレーに変更
			const color =
				status === "PENDING"
					? "#6b7280" // グレー色
					: returnStatusCustomColors[status]?.backgroundColor || "#000000";

			return {
				status,
				count,
				percentage: count ? (count / totalCount) * 100 : 0,
				color,
				label: returnStatusMap[status] || status,
			};
		});

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{/* 総額 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">香典総額</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
				</CardContent>
			</Card>

			{/* 参列者数 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">参列者数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalCount}名</div>
					<div className="text-xs text-muted-foreground">
						葬儀: {attendanceCounts.FUNERAL}名 / 弔問: {attendanceCounts.CONDOLENCE_VISIT}名 / 欠席:{" "}
						{attendanceCounts.ABSENT}名
					</div>
				</CardContent>
			</Card>

			{/* 返礼進捗 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">返礼進捗</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="text-2xl font-bold">{Math.round(returnProgressPercentage)}%</div>
						<div className="text-xs text-muted-foreground">
							{actualCompletedCount} / {totalCount}
						</div>
					</div>
					{/* セグメント化されたプログレスバー */}
					<div className="mt-2 space-y-2">
						<div className="flex bg-gray-200 rounded-full h-4 overflow-hidden">
							{statusSegments.map((segment) => (
								<div
									key={segment.status}
									className="h-full transition-all duration-300"
									style={{
										width: `${segment.percentage}%`,
										backgroundColor: segment.color,
									}}
									title={`${segment.label}: ${segment.count}名 (${segment.percentage.toFixed(1)}%)`}
								/>
							))}
						</div>
						{/* ステータスの凡例 */}
						<div className="flex flex-wrap gap-2 text-xs">
							{statusSegments.map((segment) => (
								<div key={segment.status} className="flex items-center gap-1">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: segment.color }}
									/>
									<span className="text-muted-foreground">
										{segment.label}: {segment.count}名
									</span>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* グラフセクション */}
			<div className="col-span-full grid gap-4 md:grid-cols-2">
				{/* 参列種別の円グラフ */}
				<Card>
					<CardHeader>
						<CardTitle>参列種別</CardTitle>
					</CardHeader>
					<CardContent className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={attendanceData}
									cx="50%"
									cy="50%"
									innerRadius={80}
									outerRadius={120}
									paddingAngle={5}
									dataKey="value"
									label={({ name, value, percent }) =>
										`${name}: ${value}名 (${(percent * 100).toFixed(1)}%)`
									}
								>
									{attendanceData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 金額別分布 */}
				<Card>
					<CardHeader>
						<CardTitle>金額別分布</CardTitle>
					</CardHeader>
					<CardContent className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={amountDistribution} layout="vertical" margin={{ left: 80 }}>
								<XAxis type="number" allowDecimals={false} />
								<YAxis type="category" dataKey="name" width={80} fontSize={12} />
								<Tooltip formatter={(value, name) => (name === "件数" ? `${value}件` : value)} />
								<Bar dataKey="count" fill="#2563eb" name="件数" radius={[0, 4, 4, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
});
