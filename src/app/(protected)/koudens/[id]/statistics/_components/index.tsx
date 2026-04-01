"use client";

import { memo, useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReturnStatus } from "@/components/ui/status-badge";
import { returnStatusCustomColors, returnStatusMap } from "@/components/ui/status-badge";
import { attendanceTypeMap } from "@/types/entries";
import { formatCurrency } from "@/utils/currency";

interface KoudenStatisticsProps {
	totalAmount: number;
	koudenOnlyTotal?: number; // 🎯 フェーズ7: 香典のみの合計
	offeringAllocationsTotal?: number; // 🎯 フェーズ7: お供物配分の合計
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
	koudenOnlyTotal,
	offeringAllocationsTotal,
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

	// 🎯 フェーズ7: 配分情報の可視化データ
	const hasAllocationData = koudenOnlyTotal !== undefined && offeringAllocationsTotal !== undefined;
	const actualKoudenTotal = koudenOnlyTotal || totalAmount;
	const actualOfferingTotal = offeringAllocationsTotal || 0;

	// レスポンシブ対応のためのwindow幅チェック
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// 円グラフ用のデータを日本語に変換（凡例表示用）
	const pieChartData = attendanceData.map((entry) => ({
		...entry,
		name: attendanceTypeMap[entry.name as keyof typeof attendanceTypeMap] || entry.name,
	}));

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{/* 配分込み総額 */}
			<Card className="md:col-span-2">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						{hasAllocationData ? "合計金額（配分込み）" : "香典総額"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold mb-2">{formatCurrency(totalAmount)}</div>
					{hasAllocationData && actualOfferingTotal > 0 && (
						<div className="space-y-1 text-sm text-muted-foreground">
							<div className="flex justify-between">
								<span>香典:</span>
								<span className="font-medium">{formatCurrency(actualKoudenTotal)}</span>
							</div>
							<div className="flex justify-between">
								<span>お供物配分:</span>
								<span className="font-medium text-green-600">
									+{formatCurrency(actualOfferingTotal)}
								</span>
							</div>
							<hr className="my-1" />
							<div className="flex justify-between font-medium">
								<span>合計:</span>
								<span>{formatCurrency(totalAmount)}</span>
							</div>
						</div>
					)}
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
						{attendanceTypeMap.FUNERAL}: {attendanceCounts.FUNERAL}名 /{" "}
						{attendanceTypeMap.CONDOLENCE_VISIT}: {attendanceCounts.CONDOLENCE_VISIT}名 /{" "}
						{attendanceTypeMap.ABSENT}: {attendanceCounts.ABSENT}名
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
									data={pieChartData}
									cx="50%"
									cy="50%"
									innerRadius={80}
									outerRadius={120}
									paddingAngle={2}
									dataKey="value"
									// スマホではラベルを非表示、デスクトップでは表示
									label={
										!isMobile
											? ({ value, percent }: { value: number; percent?: number }) =>
													`${value}名 (${((percent ?? 0) * 100).toFixed(1)}%)`
											: false
									}
									labelLine={false}
								>
									{pieChartData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									formatter={(value, name) => [`${value}名`, name]}
									labelFormatter={() => ""}
								/>
								<Legend
									verticalAlign="bottom"
									height={36}
									formatter={(value: string, entry: { payload?: { value?: number } }) =>
										`${value}: ${entry.payload?.value}名`
									}
								/>
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 金額別分布 */}
				<Card>
					<CardHeader>
						<CardTitle>金額別分布{hasAllocationData ? "（配分込み）" : ""}</CardTitle>
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
