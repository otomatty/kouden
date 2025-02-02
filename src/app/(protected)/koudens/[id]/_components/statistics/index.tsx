import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Entry } from "@//types/entries";
import { formatCurrency } from "@/utils/currency";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
} from "recharts";

interface KoudenStatisticsProps {
	entries: Entry[];
}

const ATTENDANCE_COLORS = {
	FUNERAL: "#2563eb", // blue-600
	CONDOLENCE_VISIT: "#16a34a", // green-600
	ABSENT: "#dc2626", // red-600
};

const ATTENDANCE_LABELS = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
};

export function KoudenStatistics({ entries }: KoudenStatisticsProps) {
	// 統計データの計算
	const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

	const attendanceCounts = entries.reduce(
		(acc, entry) => {
			acc[entry.attendanceType] = (acc[entry.attendanceType] || 0) + 1;
			return acc;
		},
		{ FUNERAL: 0, CONDOLENCE_VISIT: 0, ABSENT: 0 } as Record<Entry["attendance_type"], number>,
	);

	const returnProgress = entries.reduce(
		(acc, entry) => {
			entry.is_return_completed ? acc.completed++ : acc.pending++;
			return acc;
		},
		{ completed: 0, pending: 0 },
	);

	const returnProgressPercentage = (returnProgress.completed / entries.length) * 100;

	// 金額帯別の分布データ
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

	// 参列種別の円グラフデータ
	const attendanceData = Object.entries(attendanceCounts).map(([key, value]) => ({
		name: ATTENDANCE_LABELS[key as keyof typeof ATTENDANCE_LABELS],
		value,
		color: ATTENDANCE_COLORS[key as keyof typeof ATTENDANCE_COLORS],
	}));

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{/* 総額 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">香典総額</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
				</CardContent>
			</Card>

			{/* 参列者数 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">参列者数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{entries.length}名</div>
					<div className="text-xs text-muted-foreground">
						葬儀: {attendanceCounts.FUNERAL}名 / 弔問: {attendanceCounts.CONDOLENCE_VISIT}名 / 欠席:{" "}
						{attendanceCounts.ABSENT}名
					</div>
				</CardContent>
			</Card>

			{/* 返礼進捗 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">返礼進捗</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="text-2xl font-bold">{Math.round(returnProgressPercentage)}%</div>
						<div className="text-xs text-muted-foreground">
							{returnProgress.completed} / {entries.length}
						</div>
					</div>
					<Progress value={returnProgressPercentage} className="mt-2" />
				</CardContent>
			</Card>

			{/* グラフセクション */}
			<div className="col-span-full grid gap-4 md:grid-cols-2">
				{/* 参列種別の円グラフ */}
				<Card>
					<CardHeader>
						<CardTitle>参列種別</CardTitle>
					</CardHeader>
					<CardContent className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={attendanceData}
									cx="50%"
									cy="50%"
									innerRadius={80}
									outerRadius={120}
									paddingAngle={5}
									dataKey="value"
									label={({ name, value, percent }) =>
										`${name}: ${value}名 (${(percent * 100).toFixed(1)}%)`
									}
								>
									{attendanceData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 金額帯別分布 */}
				<Card>
					<CardHeader>
						<CardTitle>金額帯別分布</CardTitle>
					</CardHeader>
					<CardContent className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={amountDistribution} layout="vertical" margin={{ left: 80 }}>
								<XAxis type="number" allowDecimals={false} />
								<YAxis type="category" dataKey="name" width={80} fontSize={12} />
								<Tooltip formatter={(value, name) => (name === "件数" ? `${value}件` : value)} />
								<Bar dataKey="count" fill="#2563eb" name="件数" radius={[0, 4, 4, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
