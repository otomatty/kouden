import { Check, PenLine, Send, UserPlus, UserSearch } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

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
		id: "check-koudens",
		icon: UserSearch,
		title: "香典の確認",
		description: "確認したいときに、いただいた香典の内容を確認できます。",
	},
];

export function HowItWorksSection() {
	return (
		<Section id="how-it-works" bgClassName="bg-gray-50 dark:bg-gray-900">
			<SectionTitle title="使い方" subtitle="4つの簡単なステップで始められます" className="mb-16" />
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{steps.map((step) => (
					<div
						key={step.id}
						className="relative flex flex-row items-start text-left space-x-4 lg:flex-col lg:items-center lg:text-center lg:space-y-4 lg:space-x-0"
					>
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
		</Section>
	);
}
