import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CaseStatusStats {
	preparation: number;
	inProgress: number;
	completed: number;
	attention: number;
}

interface CaseStatusStatsProps {
	stats: CaseStatusStats;
}

/**
 * 案件ステータス統計表示コンポーネント
 * 各ステータスの件数を視覚的に表示
 */
export function CaseStatusStats({ stats }: CaseStatusStatsProps) {
	const statusItems = [
		{
			label: "準備中",
			count: stats.preparation,
			variant: "secondary" as const,
			bgColor: "bg-blue-100 text-blue-800",
		},
		{
			label: "施行中",
			count: stats.inProgress,
			variant: "default" as const,
			bgColor: "bg-green-100 text-green-800",
		},
		{
			label: "完了",
			count: stats.completed,
			variant: "outline" as const,
			bgColor: "bg-gray-100 text-gray-800",
		},
		{
			label: "要注意",
			count: stats.attention,
			variant: "destructive" as const,
			bgColor: "bg-red-100 text-red-800",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
			{statusItems.map((item) => (
				<Card key={item.label}>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Badge variant={item.variant} className={item.bgColor}>
								{item.label}
							</Badge>
							<span className="text-2xl font-bold">{item.count}件</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
