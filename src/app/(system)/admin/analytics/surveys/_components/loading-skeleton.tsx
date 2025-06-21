"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SurveyAnalyticsSkeleton() {
	// メトリクススケルトン配列をメモ化
	const metricsSkeletons = useMemo(
		() =>
			Array.from({ length: 4 }, (_, i) => ({
				id: `metrics-skeleton-${i}`,
			})),
		[],
	);

	// チャートスケルトン配列をメモ化
	const chartSkeletons = useMemo(
		() =>
			Array.from({ length: 4 }, (_, i) => ({
				id: `chart-skeleton-${i}`,
				items: Array.from({ length: 3 }, (_, j) => ({
					id: `chart-skeleton-item-${i}-${j}`,
				})),
			})),
		[],
	);

	return (
		<div className="space-y-6">
			{/* メトリクススケルトン */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{metricsSkeletons.map((skeleton) => (
					<Card key={skeleton.id}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-[100px]" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-[60px] mb-2" />
							<Skeleton className="h-3 w-[120px]" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* チャートスケルトン */}
			<div className="grid gap-6 lg:grid-cols-2">
				{chartSkeletons.map((skeleton) => (
					<Card key={skeleton.id}>
						<CardHeader>
							<Skeleton className="h-6 w-[150px]" />
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{skeleton.items.map((item) => (
									<div key={item.id} className="space-y-2">
										<div className="flex justify-between">
											<Skeleton className="h-4 w-[100px]" />
											<Skeleton className="h-4 w-[60px]" />
										</div>
										<Skeleton className="h-2 w-full" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
