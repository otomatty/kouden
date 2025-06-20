import { checkAdminPermission } from "@/app/_actions/admin/permissions";

import { getEntriesForAdmin } from "@/app/_actions/entries";
import { calculateEntryTotalAmount } from "@/app/_actions/offerings/queries";
import { KoudenStatistics } from "@/app/(protected)/koudens/[id]/statistics/_components";
import type { Entry } from "@/types/entries";

interface AdminStatisticsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * エントリーデータから統計情報を計算する
 * フェーズ7: 配分込み金額計算を含む
 */
async function calculateStatistics(entries: Entry[]) {
	// 🎯 フェーズ7実装: 配分込み金額計算
	const entryTotalAmounts = await Promise.all(
		entries.map(async (entry) => {
			const result = await calculateEntryTotalAmount(entry.id);
			return {
				entryId: entry.id,
				koudenAmount: entry.amount || 0,
				offeringTotal: result.success ? result.data?.offering_total || 0 : 0,
				calculatedTotal: result.success
					? result.data?.calculated_total || entry.amount || 0
					: entry.amount || 0,
			};
		}),
	);

	// 配分込み総額計算
	const totalAmountWithAllocations = entryTotalAmounts.reduce(
		(sum, entryData) => sum + entryData.calculatedTotal,
		0,
	);

	// 香典のみの合計金額
	const koudenOnlyTotal = entryTotalAmounts.reduce(
		(sum, entryData) => sum + entryData.koudenAmount,
		0,
	);

	// お供物配分の合計金額
	const offeringAllocationsTotal = entryTotalAmounts.reduce(
		(sum, entryData) => sum + entryData.offeringTotal,
		0,
	);

	// 参列種別カウント
	const attendanceCounts = entries.reduce(
		(counts, entry) => {
			const type = entry.attendanceType || "ABSENT";
			counts[type] = (counts[type] || 0) + 1;
			return counts;
		},
		{ FUNERAL: 0, CONDOLENCE_VISIT: 0, ABSENT: 0 } as Record<
			"FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT",
			number
		>,
	);

	// 返礼進捗
	const completed = entries.filter((entry) => entry.return_status === "COMPLETED").length;
	const pending = entries.length - completed;
	const returnProgress = { completed, pending };
	const returnProgressPercentage = entries.length > 0 ? (completed / entries.length) * 100 : 0;

	// 配分込み金額別分布（より正確な分布計算）
	const amountRanges = [
		{ name: "～5,000円", min: 0, max: 5000 },
		{ name: "5,001～10,000円", min: 5001, max: 10000 },
		{ name: "10,001～30,000円", min: 10001, max: 30000 },
		{ name: "30,001円～", min: 30001, max: Number.MAX_SAFE_INTEGER },
	];

	const amountDistribution = amountRanges.map((range) => ({
		name: range.name,
		count: entryTotalAmounts.filter((entryData) => {
			const amount = entryData.calculatedTotal;
			return amount >= range.min && amount <= range.max;
		}).length,
	}));

	// 参列種別データ（円グラフ用）
	const attendanceData = [
		{ name: "葬儀参列", value: attendanceCounts.FUNERAL, color: "#2563eb" },
		{ name: "弔問", value: attendanceCounts.CONDOLENCE_VISIT, color: "#16a34a" },
		{ name: "欠席", value: attendanceCounts.ABSENT, color: "#dc2626" },
	].filter((item) => item.value > 0);

	return {
		totalAmount: totalAmountWithAllocations,
		koudenOnlyTotal,
		offeringAllocationsTotal,
		attendanceCounts,
		returnProgress,
		returnProgressPercentage,
		amountDistribution,
		attendanceData,
	};
}

/**
 * 管理者用統計（statistics）のページコンポーネント
 * - 香典帳の統計情報を表示
 * - グラフや数値で表示
 * - 管理者権限でアクセス
 * - フェーズ7: 配分込み金額計算を実装
 */
export default async function AdminStatisticsPage({ params }: AdminStatisticsPageProps) {
	const { id: koudenId } = await params;

	// 管理者権限チェック
	await checkAdminPermission();

	// 統計情報の計算のため、全エントリーを取得
	const { entries } = await getEntriesForAdmin(koudenId, 1, Number.MAX_SAFE_INTEGER);

	// 統計データを計算（配分込み）
	const statisticsData = await calculateStatistics(entries);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<KoudenStatistics {...statisticsData} />
		</div>
	);
}
