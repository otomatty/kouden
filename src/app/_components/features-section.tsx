import { BookOpen, Gift, Map as MapIcon, Users } from "lucide-react";

const features = [
	{
		id: "digital-management",
		icon: BookOpen,
		title: "香典帳のデジタル管理",
		description:
			"香典帳の記帳をデジタル化し、簡単に記録・管理が可能。過去の記録も瞬時に検索できます。",
	},
	{
		id: "gift-management",
		icon: Gift,
		title: "返礼品の効率的な管理",
		description:
			"返礼品の在庫管理から配送状況まで、すべてを一元管理。適切な返礼品の選定もサポートします。",
	},
	{
		id: "route-optimization",
		icon: MapIcon,
		title: "配達ルートの最適化",
		description:
			"返礼品の配達ルートを自動で最適化。効率的な配達計画を立てることができます。",
	},
	{
		id: "relationship-management",
		icon: Users,
		title: "関係性の管理",
		description: "贈答履歴や関係性を記録し、適切な返礼品の選定に活用できます。",
	},
];

export function FeaturesSection() {
	return (
		<section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
			<div className="container px-4 md:px-6 mx-auto">
				<div className="text-center space-y-4">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
						主な機能
					</h2>
					<p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
						香典帳の管理をより簡単に、より効率的に
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
					{features.map((feature) => (
						<div
							key={feature.id}
							className="flex flex-col items-center text-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
						>
							<div className="p-3 bg-primary/10 rounded-full">
								<feature.icon className="w-6 h-6 text-primary" />
							</div>
							<h3 className="text-xl font-bold">{feature.title}</h3>
							<p className="text-gray-500 dark:text-gray-400">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
