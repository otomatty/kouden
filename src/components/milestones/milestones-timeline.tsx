import type { MilestoneMeta } from "@/lib/milestones";
import { MilestoneCard } from "./milestone-card";

interface MilestonesTimelineProps {
	milestones: MilestoneMeta[];
}

export function MilestonesTimeline({ milestones }: MilestonesTimelineProps) {
	if (milestones.length === 0) {
		return null;
	}

	return (
		<div className="relative">
			{/* 水平タイムライン */}
			<div className="overflow-x-auto pb-6">
				<div className="flex space-x-8 min-w-max px-4">
					{milestones.map((milestone, index) => (
						<div key={milestone.period} className="relative flex flex-col items-center">
							{/* タイムライン点 */}
							<div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg mb-4 relative z-10" />

							{/* タイムライン線（最後の要素以外） */}
							{index < milestones.length - 1 && (
								<div className="absolute top-2 left-8 w-8 h-0.5 bg-gradient-to-r from-primary to-border" />
							)}

							{/* 期間ラベル */}
							<div className="text-xs font-medium text-muted-foreground mb-2 bg-background px-2 py-1 rounded-full border">
								{milestone.period.replace("-", " ").toUpperCase()}
							</div>

							{/* マイルストーンカード */}
							<MilestoneCard milestone={milestone} />
						</div>
					))}
				</div>
			</div>

			{/* スクロールヒント */}
			<div className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
				<span>←</span>
				<span>横にスクロールして全てのマイルストーンを確認できます</span>
				<span>→</span>
			</div>

			{/* モバイル用の追加ヒント */}
			<div className="md:hidden text-center text-xs text-muted-foreground mt-2">
				📱 スワイプでスクロールできます
			</div>
		</div>
	);
}
