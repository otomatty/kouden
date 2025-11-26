import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MilestoneMeta } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, CheckCircle, Clock, Loader } from "lucide-react";
import Link from "next/link";

interface MilestoneCardProps {
	milestone: MilestoneMeta;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
	// ステータス別の設定
	const statusConfig = {
		planned: {
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
			icon: Clock,
			label: "計画中",
		},
		"in-progress": {
			color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
			icon: Loader,
			label: "進行中",
		},
		completed: {
			color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			icon: CheckCircle,
			label: "完了",
		},
	};

	// 優先度別の設定
	const priorityConfig = {
		high: {
			cardClass: "border-red-200 bg-red-50/50 dark:bg-red-950/50 dark:border-red-800",
			badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		},
		medium: {
			cardClass: "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/50 dark:border-yellow-800",
			badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
		},
		low: {
			cardClass: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/50 dark:border-blue-800",
			badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		},
	};

	const StatusIcon = statusConfig[milestone.status].icon;
	const config = priorityConfig[milestone.priority];

	// 日付のフォーマット
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<Link href={`/milestones/${milestone.period}`} className="block group">
			<Card
				className={cn(
					"w-80 h-auto cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-105",
					config.cardClass,
				)}
			>
				<CardHeader className="pb-3">
					{/* ステータスと優先度バッジ */}
					<div className="flex items-center justify-between mb-3">
						<Badge className={statusConfig[milestone.status].color}>
							<StatusIcon className="w-3 h-3 mr-1" />
							{statusConfig[milestone.status].label}
						</Badge>
						<Badge variant="outline" className={config.badgeClass}>
							{milestone.priority === "high"
								? "高優先度"
								: milestone.priority === "medium"
									? "中優先度"
									: "低優先度"}
						</Badge>
					</div>

					<CardTitle className="text-lg group-hover:text-primary transition-colors">
						{milestone.title}
					</CardTitle>
					<CardDescription className="text-sm">{milestone.description}</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* 進捗バー */}
					<div>
						<div className="flex justify-between text-sm mb-2">
							<span className="font-medium">進捗</span>
							<span className="text-primary font-semibold">{milestone.progress}%</span>
						</div>
						<Progress value={milestone.progress} className="w-full h-2" />
					</div>

					{/* 期限 */}
					<div className="flex items-center text-sm text-muted-foreground">
						<Calendar className="w-4 h-4 mr-2 text-primary" />
						<span>目標: {formatDate(milestone.targetDate)}</span>
					</div>

					{/* 主要機能（最大3つ表示） */}
					<div>
						<p className="text-sm font-medium mb-2 text-foreground">主要機能</p>
						<ul className="space-y-1">
							{milestone.features.slice(0, 3).map((feature) => (
								<li key={feature} className="text-xs text-muted-foreground flex items-start">
									<div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0" />
									<span className="leading-relaxed">{feature}</span>
								</li>
							))}
							{milestone.features.length > 3 && (
								<li className="text-xs text-muted-foreground flex items-center">
									<div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-1.5 mr-2 flex-shrink-0" />
									<span>他 {milestone.features.length - 3} 件の機能</span>
								</li>
							)}
						</ul>
					</div>

					{/* カテゴリ */}
					<div className="pt-2 border-t border-border/50">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{milestone.category === "feature"
									? "🆕 新機能"
									: milestone.category === "improvement"
										? "🔧 改善"
										: "🏗️ インフラ"}
							</span>
							<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
