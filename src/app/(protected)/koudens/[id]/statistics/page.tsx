import { getEntries } from "@/app/_actions/entries";
import { calculateEntryTotalAmountBulk } from "@/app/_actions/offerings/queries";
import { KoudenStatistics } from "./_components";

interface StatisticsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 統計（statistics）のページコンポーネント
 * - 香典帳の統計情報を表示
 * - グラフや数値で表示
 * - お供物配分込みの正確な金額計算を実装
 */
export default async function StatisticsPage({ params }: StatisticsPageProps) {
	const { id: koudenId } = await params;
	const { entries } = await getEntries(koudenId, 1, Number.MAX_SAFE_INTEGER);

	// 配分込み金額をbulkで取得（N+1解消）
	const bulkResult = await calculateEntryTotalAmountBulk(entries.map((e) => e.id));
	if (!(bulkResult.success && bulkResult.data)) {
		// 失敗時は0埋めではなく明示的に例外を投げ、誤った統計表示を防ぐ
		throw new Error(
			`Failed to calculate entry totals in bulk: ${bulkResult.error ?? "unknown error"}`,
		);
	}
	const amountsMap = bulkResult.data;

	const entryTotalAmounts = entries.map((entry) => {
		const stats = amountsMap.get(entry.id);
		return {
			entryId: entry.id,
			koudenAmount: entry.amount,
			offeringTotal: stats?.offering_total ?? 0,
			calculatedTotal: stats?.calculated_total ?? entry.amount,
		};
	});

	// 配分込み合計金額の計算
	const totalAmountWithAllocations = entryTotalAmounts.reduce(
		(sum, entryData) => sum + entryData.calculatedTotal,
		0,
	);

	// 香典のみの合計金額（従来）
	const koudenOnlyTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);

	// お供物配分の合計金額
	const offeringAllocationsTotal = entryTotalAmounts.reduce(
		(sum, entryData) => sum + entryData.offeringTotal,
		0,
	);

	// サーバーサイドで集計
	const attendanceCounts = entries.reduce(
		(acc, entry) => {
			acc[entry.attendanceType] = (acc[entry.attendanceType] || 0) + 1;
			return acc;
		},
		{ FUNERAL: 0, CONDOLENCE_VISIT: 0, ABSENT: 0 } as Record<string, number>,
	);

	// 返礼状況の集計：4つのステータスに対応
	const returnStatusCounts = entries.reduce(
		(acc, entry) => {
			const status = entry.returnStatus || "PENDING";
			acc[status] = (acc[status] || 0) + 1;
			return acc;
		},
		{ PENDING: 0, PARTIAL_RETURNED: 0, COMPLETED: 0, NOT_REQUIRED: 0 } as Record<string, number>,
	);

	// 完了率の計算：COMPLETED と NOT_REQUIRED を完了とみなす
	const completedCount =
		(returnStatusCounts.COMPLETED || 0) + (returnStatusCounts.NOT_REQUIRED || 0);
	const returnProgressPercentage = entries.length > 0 ? (completedCount / entries.length) * 100 : 0;

	// 配分込み金額ごとに集計（より正確な分布計算）
	const amountDistribution = Object.entries(
		entryTotalAmounts.reduce(
			(acc, entryData) => {
				const key = entryData.calculatedTotal;
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
				totalAmount={totalAmountWithAllocations}
				koudenOnlyTotal={koudenOnlyTotal}
				offeringAllocationsTotal={offeringAllocationsTotal}
				attendanceCounts={attendanceCounts}
				returnStatusCounts={returnStatusCounts}
				returnProgressPercentage={returnProgressPercentage}
				completedCount={completedCount}
				amountDistribution={amountDistribution}
				attendanceData={attendanceData}
			/>
		</div>
	);
}
