"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface Survey {
	overall_satisfaction: number;
}

interface SatisfactionDistributionProps {
	surveys: Survey[];
	totalResponses: number;
}

/**
 * 満足度のスター表示
 */
function SatisfactionStars({ score }: { score: number }) {
	// スター配列をメモ化
	const stars = useMemo(
		() =>
			Array.from({ length: 5 }, (_, i) => ({
				id: `satisfaction-star-${i}`,
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

export function SatisfactionDistribution({
	surveys,
	totalResponses,
}: SatisfactionDistributionProps) {
	const labels = ["", "非常に不満", "やや不満", "普通", "満足", "非常に満足"];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Star className="h-5 w-5" />
					満足度分布
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{[5, 4, 3, 2, 1].map((score) => {
					const count = surveys.filter((s) => s.overall_satisfaction === score).length;
					const percentage = Math.round((count / totalResponses) * 100);

					return (
						<div key={score} className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="flex items-center gap-2">
									<SatisfactionStars score={score} />
									{labels[score]}
								</span>
								<span className="text-muted-foreground">
									{count}件 ({percentage}%)
								</span>
							</div>
							<Progress value={percentage} className="h-2" />
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
