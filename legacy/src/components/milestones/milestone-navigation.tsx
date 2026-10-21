import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MilestoneMeta } from "@/lib/milestones";

interface MilestoneNavigationProps {
	prevMilestone?: MilestoneMeta | null;
	nextMilestone?: MilestoneMeta | null;
}

export function MilestoneNavigation({ prevMilestone, nextMilestone }: MilestoneNavigationProps) {
	// 前後両方ともない場合は何も表示しない
	if (!prevMilestone) {
		return null;
	}
	if (!nextMilestone) {
		return null;
	}

	return (
		<div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
			{/* 前のマイルストーン */}
			<div className="flex-1">
				{prevMilestone && (
					<Link href={`/milestones/${prevMilestone.period}`} className="group block max-w-sm">
						<div className="flex items-start text-muted-foreground hover:text-foreground transition-colors">
							<ChevronLeft className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
							<div>
								<div className="text-xs uppercase tracking-wide mb-1 text-muted-foreground">
									前のマイルストーン
								</div>
								<div className="font-medium group-hover:underline line-clamp-2">
									{prevMilestone.title}
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									{prevMilestone.period.replace("-", " ").toUpperCase()}
								</div>
							</div>
						</div>
					</Link>
				)}
			</div>

			{/* 中央のスペーサー（オプション） */}
			<div className="flex-shrink-0 mx-4">
				{prevMilestone && nextMilestone && <div className="w-px h-12 bg-border" />}
			</div>

			{/* 次のマイルストーン */}
			<div className="flex-1 text-right">
				{nextMilestone && (
					<Link
						href={`/milestones/${nextMilestone.period}`}
						className="group block max-w-sm ml-auto"
					>
						<div className="flex items-start justify-end text-muted-foreground hover:text-foreground transition-colors">
							<div className="text-right">
								<div className="text-xs uppercase tracking-wide mb-1 text-muted-foreground">
									次のマイルストーン
								</div>
								<div className="font-medium group-hover:underline line-clamp-2">
									{nextMilestone.title}
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									{nextMilestone.period.replace("-", " ").toUpperCase()}
								</div>
							</div>
							<ChevronRight className="w-5 h-5 ml-2 mt-0.5 flex-shrink-0" />
						</div>
					</Link>
				)}
			</div>
		</div>
	);
}
