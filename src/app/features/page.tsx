import { Header } from "../_components/header";
import {
	BookOpen,
	Gift,
	Map as MapIcon,
	Users,
	Share2,
	History,
	FileSpreadsheet,
	Bell,
} from "lucide-react";

const features = [
	{
		id: "digital-management",
		icon: BookOpen,
		title: "香典帳のデジタル管理",
		description:
			"香典帳の記帳をデジタル化し、簡単に記録・管理が可能。過去の記録も瞬時に検索できます。",
		details: [
			{ id: "input", text: "直感的な入力フォームで簡単記帳" },
			{ id: "search", text: "過去の記録をすぐに検索可能" },
			{ id: "calc", text: "自動計算機能で集計ミスを防止" },
			{ id: "backup", text: "データのバックアップで安全に保管" },
		],
	},
	{
		id: "gift-management",
		icon: Gift,
		title: "返礼品の効率的な管理",
		description:
			"返礼品の在庫管理から配送状況まで、すべてを一元管理。適切な返礼品の選定もサポートします。",
		details: [
			{ id: "inventory", text: "返礼品の在庫をリアルタイムに管理" },
			{ id: "selection", text: "適切な返礼品の選定をサポート" },
			{ id: "tracking", text: "配送状況のトラッキング" },
			{ id: "budget", text: "予算管理と経費の可視化" },
		],
	},
	{
		id: "route-optimization",
		icon: MapIcon,
		title: "配達ルートの最適化",
		description:
			"返礼品の配達ルートを自動で最適化。効率的な配達計画を立てることができます。",
		details: [
			{ id: "ai-route", text: "AIによる最適な配達ルートの提案" },
			{ id: "schedule", text: "配達スケジュールの自動作成" },
			{ id: "progress", text: "リアルタイムの進捗管理" },
			{ id: "completion", text: "配達完了の自動記録" },
		],
	},
	{
		id: "relationship-management",
		icon: Users,
		title: "関係性の管理",
		description: "贈答履歴や関係性を記録し、適切な返礼品の選定に活用できます。",
		details: [
			{ id: "history", text: "贈答履歴の一元管理" },
			{ id: "visualization", text: "関係性の可視化" },
			{ id: "suggestion", text: "適切な返礼品の提案" },
			{ id: "dates", text: "重要な記念日の管理" },
		],
	},
	{
		id: "collaboration",
		icon: Share2,
		title: "共同編集機能",
		description: "家族や関係者と情報を共有し、共同で香典帳を管理できます。",
		details: [
			{ id: "realtime", text: "リアルタイムの共同編集" },
			{ id: "permissions", text: "権限管理で安全な共有" },
			{ id: "history", text: "変更履歴の記録" },
			{ id: "comments", text: "コメント機能でコミュニケーション" },
		],
	},
	{
		id: "history",
		icon: History,
		title: "履歴管理",
		description: "すべての変更履歴を記録し、いつでも過去の記録を確認できます。",
		details: [
			{ id: "auto-record", text: "変更履歴の自動記録" },
			{ id: "restore", text: "過去のバージョンの復元" },
			{ id: "audit", text: "監査ログの出力" },
			{ id: "integrity", text: "データの完全性保証" },
		],
	},
	{
		id: "reporting",
		icon: FileSpreadsheet,
		title: "レポート機能",
		description: "様々な形式でデータを出力し、必要な情報を簡単に共有できます。",
		details: [
			{ id: "custom", text: "カスタマイズ可能なレポート" },
			{ id: "formats", text: "複数のファイル形式に対応" },
			{ id: "charts", text: "グラフや図表での可視化" },
			{ id: "auto-gen", text: "定期的なレポート自動生成" },
		],
	},
	{
		id: "notifications",
		icon: Bell,
		title: "通知機能",
		description:
			"重要な更新や期限を自動で通知し、必要なアクションを見逃しません。",
		details: [
			{ id: "settings", text: "カスタマイズ可能な通知設定" },
			{ id: "sync", text: "複数のデバイスでの同期" },
			{ id: "alerts", text: "重要なイベントの事前通知" },
			{ id: "deadlines", text: "タスクの期限管理" },
		],
	},
];

export default function FeaturesPage() {
	return (
		<>
			<Header />
			<main className="min-h-screen pt-16">
				<section className="py-24 bg-gray-50 dark:bg-gray-900">
					<div className="container px-4 md:px-6 mx-auto">
						<div className="text-center space-y-4 mb-16">
							<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
								機能詳細
							</h1>
							<p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
								香典帳アプリの全機能をご紹介します
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{features.map((feature) => (
								<div
									key={feature.id}
									className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-4"
								>
									<div className="flex items-center space-x-4">
										<div className="p-3 bg-primary/10 rounded-full">
											<feature.icon className="w-6 h-6 text-primary" />
										</div>
										<h2 className="text-2xl font-bold">{feature.title}</h2>
									</div>
									<p className="text-gray-500 dark:text-gray-400">
										{feature.description}
									</p>
									<ul className="space-y-2">
										{feature.details.map((detail) => (
											<li
												key={detail.id}
												className="flex items-center space-x-2"
											>
												<div className="w-1.5 h-1.5 rounded-full bg-primary" />
												<span className="text-gray-600 dark:text-gray-300">
													{detail.text}
												</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
