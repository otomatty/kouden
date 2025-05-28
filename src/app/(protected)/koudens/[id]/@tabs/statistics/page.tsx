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
			entry.is_return_completed ? acc.completed++ : acc.pending++;
			return acc;
		},
		{ completed: 0, pending: 0 },
	);
	const returnProgressPercentage = (returnProgress.completed / entries.length) * 100;
	const amountRanges = [
		{ range: "〜5千円", min: 0, max: 5000 },
		{ range: "5千円〜1万円", min: 5000, max: 10000 },
		{ range: "1〜2万円", min: 10000, max: 20000 },
		{ range: "2〜3万円", min: 20000, max: 30000 },
		{ range: "3〜5万円", min: 30000, max: 50000 },
		{ range: "5〜7万円", min: 50000, max: 70000 },
		{ range: "7〜10万円", min: 70000, max: 100000 },
		{ range: "10万円〜", min: 100000, max: Number.POSITIVE_INFINITY },
	];
	const amountDistribution = amountRanges
		.map((range) => ({
			name: range.range,
			count: entries.filter((entry) => entry.amount >= range.min && entry.amount < range.max)
				.length,
		}))
		.reverse();
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
