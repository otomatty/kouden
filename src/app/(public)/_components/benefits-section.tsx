import { Clock, Heart, Shield } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

const benefits = [
	{
		id: "time-saving",
		icon: Clock,
		title: "時間の節約",
		description:
			"手書きの記帳や管理表の作成にかかる時間を大幅に削減。データの入力から集計まで、すべてを効率化します。",
	},
	{
		id: "error-prevention",
		icon: Shield,
		title: "ミスの防止",
		description:
			"自動計算と入力チェック機能により、記帳ミスや集計ミスを防止。大切な記録を正確に管理できます。",
	},
	{
		id: "heartfelt-response",
		icon: Heart,
		title: "心のこもった対応",
		description:
			"過去の記録や関係性の管理により、より丁寧で心のこもった返礼品の選定と対応が可能になります。",
	},
];

export function BenefitsSection() {
	return (
		<section className="py-64 bg-white dark:bg-gray-800">
			<div className="container px-4 md:px-6 mx-auto">
				<SectionTitle
					title="導入のメリット"
					subtitle="デジタル化による効率化で、より大切なことに時間を使えます"
					className="mb-16"
				/>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{benefits.map((benefit) => (
						<div key={benefit.id} className="flex flex-col items-center text-center space-y-4">
							<div className="p-3 bg-primary/10 rounded-full">
								<benefit.icon className="w-6 h-6 text-primary" />
							</div>
							<h3 className="text-xl font-bold">{benefit.title}</h3>
							<p className="text-gray-500 dark:text-gray-400">{benefit.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
