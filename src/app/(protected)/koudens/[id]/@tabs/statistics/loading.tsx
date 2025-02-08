import { Skeleton } from "@/components/ui/skeleton";

const SUMMARY_CARDS = ["total", "attendees", "progress"] as const;
const CHART_CARDS = ["daily", "monthly"] as const;

/**
 * 統計のローディング状態を表示するコンポーネント
 * - グラフとサマリーのスケルトンを表示
 */
export default function StatisticsLoading() {
	return (
		<div className="space-y-8">
			{/* サマリーカードのスケルトン */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{SUMMARY_CARDS.map((card) => (
					<div key={`summary-${card}`} className="rounded-lg border p-8">
						<div className="space-y-3">
							<Skeleton className="h-4 w-[100px]" />
							<Skeleton className="h-8 w-[150px]" />
						</div>
					</div>
				))}
			</div>

			{/* グラフのスケルトン */}
			<div className="space-y-4">
				<div className="rounded-lg border p-4">
					<div className="space-y-4">
						<Skeleton className="h-6 w-[200px]" />
						<Skeleton className="h-[300px] w-full" />
					</div>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{CHART_CARDS.map((chart) => (
						<div key={`chart-${chart}`} className="rounded-lg border p-4">
							<div className="space-y-4">
								<Skeleton className="h-6 w-[150px]" />
								<Skeleton className="h-[200px] w-full" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
