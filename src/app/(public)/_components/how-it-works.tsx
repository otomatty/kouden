import { Check, PenLine, Send, UserPlus, UserSearch } from "lucide-react";
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
		title: "香典返しの管理",
		description: "適切な返礼品を選定し、香典返しの状況を管理できます。",
	},
	{
		id: "delivery-optimization",
		icon: UserSearch,
		title: "香典の確認",
		description: "確認したいときに、いただいた香典の内容を確認できます。",
	},
];

export function HowItWorksSection() {
	return (
		<section className="py-16 md:py-32 bg-gray-50 dark:bg-gray-900">
			<div className="container px-4 md:px-6 mx-auto">
				<SectionTitle
					title="使い方"
					subtitle="4つの簡単なステップで始められます"
					className="mb-16"
				/>
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{steps.map((step) => (
						<div
							key={step.id}
							className="relative flex flex-row items-start text-left space-x-4 lg:flex-col lg:items-center lg:text-center lg:space-y-4 lg:space-x-0"
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
							<div className="flex-1">
								<h3 className="text-xl font-bold">{step.title}</h3>
								<p className="text-gray-500 dark:text-gray-400">{step.description}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
