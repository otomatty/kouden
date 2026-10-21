"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star } from "lucide-react";

interface Survey {
	id: string;
	nps_score: number;
	overall_satisfaction: number;
	additional_feedback: string | null;
	created_at: string | null;
}

interface RecentFeedbackProps {
	surveys: Survey[];
}

/**
 * NPS分類のバッジコンポーネント
 */
function NPSBadge({ score }: { score: number }) {
	if (score >= 9) {
		return (
			<Badge variant="default" className="bg-green-500 hover:bg-green-600">
				推奨者
			</Badge>
		);
	}
	if (score >= 7) {
		return <Badge variant="secondary">中立者</Badge>;
	}
	return <Badge variant="destructive">批判者</Badge>;
}

/**
 * 満足度のスター表示
 */
function SatisfactionStars({ score }: { score: number }) {
	// スター配列をメモ化
	const stars = useMemo(
		() =>
			Array.from({ length: 5 }, (_, i) => ({
				id: `feedback-star-${i}`,
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

export function RecentFeedback({ surveys }: RecentFeedbackProps) {
	const feedbackSurveys = surveys.filter((s) => s.additional_feedback?.trim()).slice(0, 5);

	if (feedbackSurveys.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5" />
					最近のフィードバック
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{feedbackSurveys.map((survey) => (
						<div key={survey.id} className="border-l-4 border-blue-500 pl-4 py-2">
							<div className="flex items-center gap-2 mb-2">
								<NPSBadge score={survey.nps_score} />
								<SatisfactionStars score={survey.overall_satisfaction} />
								<span className="text-xs text-muted-foreground">
									{survey.created_at
										? new Date(survey.created_at).toLocaleDateString("ja-JP")
										: "日付不明"}
								</span>
							</div>
							<p className="text-sm">{survey.additional_feedback}</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
