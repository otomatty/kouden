import { Check, PenLine, Send, UserPlus } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

const steps = [
	{
		id: "account-creation",
		icon: UserPlus,
		title: "アカウント作成",
		description: "無料でアカウントを作成し、すぐに使い始めることができます。",
	},
	{
		id: "kouden-entry",
		icon: PenLine,
		title: "香典帳の記帳",
		description: "シンプルな入力フォームで、香典や供物の記録を簡単に行えます。",
	},
	{
		id: "gift-management",
		icon: Check,
		title: "返礼品の管理",
		description: "適切な返礼品を選定し、配送状況を一元管理できます。",
	},
	{
		id: "delivery-optimization",
		icon: Send,
		title: "配達の最適化",
		description: "効率的な配達ルートを自動で作成し、スムーズな配送を実現します。",
	},
];

export function HowItWorksSection() {
	return (
		<section className="py-64 bg-gray-50 dark:bg-gray-900">
			<div className="container px-4 md:px-6 mx-auto">
				<SectionTitle
					title="使い方"
					subtitle="4つの簡単なステップで始められます"
					className="mb-16"
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{steps.map((step) => (
						<div
							key={step.id}
							className="relative flex flex-col items-center text-center space-y-4"
						>
							{step.id !== "delivery-optimization" && (
								<div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700" />
							)}
							<div className="relative">
								<div className="p-3 bg-primary/10 rounded-full">
									<step.icon className="w-6 h-6 text-primary" />
								</div>
								<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
									{steps.indexOf(step) + 1}
								</div>
							</div>
							<h3 className="text-xl font-bold">{step.title}</h3>
							<p className="text-gray-500 dark:text-gray-400">{step.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
