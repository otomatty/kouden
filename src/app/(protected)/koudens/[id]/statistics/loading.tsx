import { StatsSummarySkeleton } from "@/components/custom/loading/skeletons";

/**
 * 統計のローディング状態を表示するコンポーネント
 * - グラフとサマリーのスケルトンを表示
 */
export default function StatisticsLoading() {
	return <StatsSummarySkeleton cards={3} />;
}
