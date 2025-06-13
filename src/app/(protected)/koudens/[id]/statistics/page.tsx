import { getEntries } from "@/app/_actions/entries";
import { KoudenStatistics } from "./_components";

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
	const { entries } = await getEntries(koudenId, 1, Number.MAX_SAFE_INTEGER);
	// サーバーサイドで集計
	const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
	const attendanceCounts = entries.reduce(
		(acc, entry) => {
			acc[entry.attendanceType] = (acc[entry.attendanceType] || 0) + 1;
			return acc;
		},
		{ FUNERAL: 0, CONDOLENCE_VISIT: 0, ABSENT: 0 } as Record<string, number>,
	);
	const returnProgress = entries.reduce(
		(acc, entry) => {
			// 新しいreturn_statusがCOMPLETEDの場合、またはreturn_statusがなくis_return_completedがtrueの場合は完了
			const isCompleted =
				entry.return_status === "COMPLETED" || (!entry.return_status && entry.is_return_completed);
			isCompleted ? acc.completed++ : acc.pending++;
			return acc;
		},
		{ completed: 0, pending: 0 },
	);
	const returnProgressPercentage = (returnProgress.completed / entries.length) * 100;
	// 金額ごとに集計（基本的に1千円単位）
	const amountDistribution = Object.entries(
		entries.reduce(
			(acc, entry) => {
				const key = entry.amount;
				acc[key] = (acc[key] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>,
		),
	)
		.map(([amount, count]) => ({ amount: Number(amount), count }))
		.sort((a, b) => b.amount - a.amount)
		.map(({ amount, count }) => ({ name: `${amount}円`, count }));
	const attendanceData = Object.entries(attendanceCounts).map(([key, value]) => ({
		name: key,
		value,
		color: key === "FUNERAL" ? "#2563eb" : key === "CONDOLENCE_VISIT" ? "#16a34a" : "#dc2626",
	}));

	return (
		<div className="mt-4">
			<KoudenStatistics
				totalAmount={totalAmount}
				attendanceCounts={attendanceCounts}
				returnProgress={returnProgress}
				returnProgressPercentage={returnProgressPercentage}
				amountDistribution={amountDistribution}
				attendanceData={attendanceData}
			/>
		</div>
	);
}
