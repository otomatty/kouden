import { checkAdminPermission } from "@/app/_actions/admin/permissions";

import { getEntriesForAdmin } from "@/app/_actions/entries";
import { KoudenStatistics } from "@/app/(protected)/koudens/[id]/statistics/_components";
import type { Entry } from "@/types/entries";

interface AdminStatisticsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * エントリーデータから統計情報を計算する
 */
function calculateStatistics(entries: Entry[]) {
	// 総額計算
	const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

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

	// 金額別分布
	const amountRanges = [
		{ name: "～5,000円", min: 0, max: 5000 },
		{ name: "5,001～10,000円", min: 5001, max: 10000 },
		{ name: "10,001～30,000円", min: 10001, max: 30000 },
		{ name: "30,001円～", min: 30001, max: Number.MAX_SAFE_INTEGER },
	];

	const amountDistribution = amountRanges.map((range) => ({
		name: range.name,
		count: entries.filter((entry) => {
			const amount = entry.amount || 0;
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
		totalAmount,
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
 */
export default async function AdminStatisticsPage({ params }: AdminStatisticsPageProps) {
	const { id: koudenId } = await params;

	// 管理者権限チェック
	await checkAdminPermission();

	// 統計情報の計算のため、全エントリーを取得
	const { entries } = await getEntriesForAdmin(koudenId, 1, Number.MAX_SAFE_INTEGER);

	// 統計データを計算
	const statisticsData = calculateStatistics(entries);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<KoudenStatistics {...statisticsData} />
		</div>
	);
}
