import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getContactRequestStats } from "@/app/_actions/admin/contact-requests";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
	new: {
		label: "新規",
		icon: AlertCircle,
		color: "bg-red-500",
	},
	in_progress: {
		label: "対応中",
		icon: Clock,
		color: "bg-yellow-500",
	},
	closed: {
		label: "完了",
		icon: CheckCircle,
		color: "bg-green-500",
	},
};

const categoryConfig = {
	support: "サポート",
	account: "アカウント",
	bug: "バグ報告",
	feature: "機能要望",
	business: "法人相談",
	other: "その他",
};

export async function ContactRequestsStats() {
	const stats = await getContactRequestStats();

	const statusCards = [
		{
			title: "総お問い合わせ数",
			value: stats.total,
			icon: MessageSquare,
			color: "bg-blue-500",
		},
		{
			title: "新規",
			value: stats.statusStats.new || 0,
			icon: statusConfig.new.icon,
			color: statusConfig.new.color,
		},
		{
			title: "対応中",
			value: stats.statusStats.in_progress || 0,
			icon: statusConfig.in_progress.icon,
			color: statusConfig.in_progress.color,
		},
		{
			title: "完了",
			value: stats.statusStats.closed || 0,
			icon: statusConfig.closed.icon,
			color: statusConfig.closed.color,
		},
	];

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

			{/* カテゴリ別統計 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">カテゴリ別お問い合わせ数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{Object.entries(stats.categoryStats).map(([category, count]) => (
							<div
								key={category}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
							>
								<span className="font-medium">
									{categoryConfig[category as keyof typeof categoryConfig] || category}
								</span>
								<Badge variant="secondary">{count}</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
