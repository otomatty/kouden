import { Header } from "../_components/header";
import {
	UserPlus,
	PenLine,
	Gift,
	Send,
	Share2,
	FileText,
	Bell,
} from "lucide-react";

const guides = [
	{
		id: "getting-started",
		title: "はじめに",
		steps: [
			{
				id: "account-creation",
				icon: UserPlus,
				title: "アカウント作成",
				description:
					"メールアドレスで簡単に登録できます。家族や関係者を招待することも可能です。",
				note: "※ ご利用にはGoogleアカウントが必要です。",
			},
			{
				id: "kouden-creation",
				icon: PenLine,
				title: "香典帳の作成",
				description:
					"新しい香典帳を作成し、基本情報を入力します。複数の香典帳を管理することもできます。",
			},
		],
	},
	{
		id: "daily-use",
		title: "日常的な使用方法",
		steps: [
			{
				id: "kouden-entry",
				icon: PenLine,
				title: "香典の記帳",
				description:
					"受け取った香典を簡単に記録。金額、品物、メッセージなどを入力できます。",
			},
			{
				id: "gift-selection",
				icon: Gift,
				title: "返礼品の選定",
				description:
					"記録した香典に対して、適切な返礼品を選定。予算管理も同時に行えます。",
			},
			{
				id: "delivery-management",
				icon: Send,
				title: "配達管理",
				description:
					"返礼品の配達スケジュールを管理し、最適なルートで配達を行います。",
			},
		],
	},
	{
		id: "collaboration",
		title: "共同作業",
		steps: [
			{
				id: "member-invite",
				icon: Share2,
				title: "メンバーの招待",
				description:
					"家族や関係者を招待し、共同で香典帳を管理できます。権限設定も可能です。",
			},
			{
				id: "comment-memo",
				icon: FileText,
				title: "コメントとメモ",
				description:
					"各記録にコメントやメモを追加し、関係者間で情報を共有できます。",
			},
			{
				id: "notification-settings",
				icon: Bell,
				title: "通知設定",
				description:
					"重要な更新や締め切りを通知で受け取れます。通知設定はカスタマイズ可能です。",
			},
		],
	},
];

export default function GuidePage() {
	return (
		<>
			<Header />
			<main className="min-h-screen pt-16">
				<section className="py-24 bg-gray-50 dark:bg-gray-900">
					<div className="container px-4 md:px-6 mx-auto">
						<div className="text-center space-y-4 mb-16">
							<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
								使い方ガイド
							</h1>
							<p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
								香典帳アプリの使い方を詳しく解説します
							</p>
						</div>
						<div className="space-y-16">
							{guides.map((guide) => (
								<div key={guide.id} className="space-y-8">
									<h2 className="text-3xl font-bold text-center">
										{guide.title}
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
										{guide.steps.map((step) => (
											<div
												key={step.id}
												className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-4"
											>
												<div className="flex items-center space-x-4">
													<div className="p-3 bg-primary/10 rounded-full">
														<step.icon className="w-6 h-6 text-primary" />
													</div>
													<h3 className="text-xl font-bold">{step.title}</h3>
												</div>
												<p className="text-gray-500 dark:text-gray-400">
													{step.description}
												</p>
												{step.note && (
													<p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
														{step.note}
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
