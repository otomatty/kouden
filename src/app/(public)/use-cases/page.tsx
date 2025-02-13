import { Users, Share2, Gift, Map as MapIcon } from "lucide-react";
import { PageHero } from "../_components/page-hero";

const useCases = [
	{
		id: "family-collaboration",
		title: "家族での共同管理",
		description: "家族全員で香典帳を共同管理し、効率的に返礼品の準備を進めるケース",
		icon: Users,
		steps: [
			{ id: "invite", text: "家族メンバーをアプリに招待" },
			{ id: "roles", text: "役割分担を設定（記帳係、返礼品管理係など）" },
			{ id: "share", text: "リアルタイムで情報を共有" },
			{ id: "progress", text: "進捗状況を全員で確認" },
		],
		benefits: [
			{ id: "duplicate", text: "作業の重複を防止" },
			{ id: "communication", text: "コミュニケーションの円滑化" },
			{ id: "task", text: "タスクの効率的な分担" },
			{ id: "error", text: "ミスの防止と早期発見" },
		],
	},
	{
		id: "remote-management",
		title: "遠隔地からの管理",
		description: "離れた場所にいる家族や関係者と協力して香典帳を管理するケース",
		icon: Share2,
		steps: [
			{ id: "share-online", text: "オンラインで香典帳を共有" },
			{ id: "video-call", text: "ビデオ通話での確認や相談" },
			{ id: "share-progress", text: "タスクの進捗をリアルタイム共有" },
			{ id: "share-docs", text: "必要な書類のデジタル化と共有" },
		],
		benefits: [
			{ id: "location-free", text: "場所を問わない管理" },
			{ id: "time-cost", text: "移動時間とコストの削減" },
			{ id: "quick-decision", text: "迅速な意思決定" },
			{ id: "status-sharing", text: "関係者全員の状況把握" },
		],
	},
	{
		id: "gift-coordination",
		title: "返礼品の調整と配送",
		description: "多数の返礼品を効率的に管理し、最適なタイミングで配送するケース",
		icon: Gift,
		steps: [
			{ id: "gift-selection", text: "返礼品の種類と数量の決定" },
			{ id: "budget-management", text: "予算管理と発注作業" },
			{ id: "delivery-schedule", text: "配送スケジュールの作成" },
			{ id: "tracking", text: "配送状況の追跡管理" },
		],
		benefits: [
			{ id: "inventory", text: "在庫の適切な管理" },
			{ id: "cost", text: "コストの最適化" },
			{ id: "delivery", text: "配送の効率化" },
			{ id: "confirmation", text: "受取確認の簡略化" },
		],
	},
	{
		id: "route-planning",
		title: "配達ルートの最適化",
		description: "複数の配達先を効率的に回るルートを計画するケース",
		icon: MapIcon,
		steps: [
			{ id: "destination", text: "配達先の一括登録" },
			{ id: "ai-route", text: "AIによるルート最適化" },
			{ id: "order", text: "配達順序の自動提案" },
			{ id: "data", text: "実績データの蓄積" },
		],
		benefits: [
			{ id: "time", text: "移動時間の短縮" },
			{ id: "fuel", text: "燃料費の削減" },
			{ id: "efficiency", text: "配達効率の向上" },
			{ id: "environment", text: "環境負荷の低減" },
		],
	},
];

export default function UseCasesPage() {
	return (
		<div className="space-y-24">
			<PageHero
				title="ユースケース"
				subtitle="実際の使用シーンをご紹介します"
				className="bg-gray-50 dark:bg-gray-900"
			/>

			<section className="bg-gray-50 dark:bg-gray-900">
				<div className="container px-4 md:px-6 mx-auto">
					<div className="grid grid-cols-1 gap-12">
						{useCases.map((useCase) => (
							<div
								key={useCase.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
							>
								<div className="p-8">
									<div className="flex items-center space-x-4 mb-6">
										<div className="p-3 bg-primary/10 rounded-full">
											<useCase.icon className="w-6 h-6 text-primary" />
										</div>
										<h2 className="text-2xl font-bold">{useCase.title}</h2>
									</div>
									<p className="text-gray-500 dark:text-gray-400 mb-8">{useCase.description}</p>
									<div className="grid md:grid-cols-2 gap-8">
										<div>
											<h3 className="text-xl font-bold mb-4">手順</h3>
											<ul className="space-y-3">
												{useCase.steps.map((step) => (
													<li key={step.id} className="flex items-start space-x-3">
														<span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">
															{useCase.steps.indexOf(step) + 1}
														</span>
														<span className="text-gray-600 dark:text-gray-300">{step.text}</span>
													</li>
												))}
											</ul>
										</div>
										<div>
											<h3 className="text-xl font-bold mb-4">メリット</h3>
											<ul className="space-y-3">
												{useCase.benefits.map((benefit) => (
													<li key={benefit.id} className="flex items-center space-x-3">
														<div className="w-1.5 h-1.5 rounded-full bg-primary" />
														<span className="text-gray-600 dark:text-gray-300">{benefit.text}</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
