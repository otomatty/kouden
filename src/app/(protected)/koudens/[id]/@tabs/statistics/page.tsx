import { KoudenStatistics } from "./_components";
import { getEntries } from "@/app/_actions/entries";

interface StatisticsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 統計（statistics）のページコンポーネント
 * - 香典帳の統計情報を表示
 * - グラフや数値で表示
 */
export default async function StatisticsPage({ params }: StatisticsPageProps) {
	const { id: koudenId } = await params;
	const entries = await getEntries(koudenId);

	return <KoudenStatistics entries={entries} />;
}
