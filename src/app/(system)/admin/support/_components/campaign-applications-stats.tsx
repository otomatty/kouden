import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCampaignApplicationStats } from "@/app/_actions/admin/campaign-applications";
import { Calendar, Clock, CheckCircle, XCircle, Users, TrendingUp } from "lucide-react";

const statusConfig = {
	submitted: {
		label: "送信済み",
		icon: Clock,
		color: "bg-blue-500",
	},
	confirmed: {
		label: "確定",
		icon: CheckCircle,
		color: "bg-green-500",
	},
	completed: {
		label: "実施完了",
		icon: CheckCircle,
		color: "bg-emerald-500",
	},
	cancelled: {
		label: "キャンセル",
		icon: XCircle,
		color: "bg-red-500",
	},
};

export async function CampaignApplicationsStats() {
	const stats = await getCampaignApplicationStats();

	const statusCards = [
		{
			title: "総申し込み数",
			value: stats.total,
			icon: Users,
			color: "bg-purple-500",
		},
		{
			title: "今日の申し込み",
			value: stats.today,
			icon: TrendingUp,
			color: "bg-orange-500",
		},
		{
			title: "今週の申し込み",
			value: stats.thisWeek,
			icon: Calendar,
			color: "bg-indigo-500",
		},
	];

	// ステータス別カードを動的に追加
	for (const [status, count] of Object.entries(stats.statusStats)) {
		const config = statusConfig[status as keyof typeof statusConfig];
		if (config) {
			statusCards.push({
				title: config.label,
				value: count as number,
				icon: config.icon,
				color: config.color,
			});
		}
	}

	return (
		<div className="space-y-6">
			{/* ステータス別統計 */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{statusCards.map((card) => {
					const Icon = card.icon;
					return (
						<Card key={card.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
								<div className={`p-2 rounded-full ${card.color}`}>
									<Icon className="h-4 w-4 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{card.value}</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* ステータス詳細 */}
			{Object.keys(stats.statusStats).length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">ステータス別申し込み状況</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{Object.entries(stats.statusStats).map(([status, count]) => {
								const config = statusConfig[status as keyof typeof statusConfig];
								return (
									<div
										key={status}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div className="flex items-center gap-2">
											{config && (
												<div className={`p-1 rounded-full ${config.color}`}>
													<config.icon className="h-3 w-3 text-white" />
												</div>
											)}
											<span className="font-medium">{config?.label || status}</span>
										</div>
										<Badge variant="secondary">{count}</Badge>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
