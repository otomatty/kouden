import type React from "react";
import { ClipboardList, BarChart2, ShieldCheck } from "lucide-react";

interface PainPoint {
	title: string;
	description: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const points: PainPoint[] = [
	{
		title: "記録の壁",
		description: "葬儀直後の多忙と悲しみの中での、慣れない手書き作業の負担。",
		icon: ClipboardList,
	},
	{
		title: "集計の壁",
		description: "金額が合わないストレスと、香典返し準備のための二度手間。",
		icon: BarChart2,
	},
	{
		title: "マナーの壁",
		description: "「失礼にあたらないか」という挨拶状や返礼品選びでの不安。",
		icon: ShieldCheck,
	},
];

/**
 * ご遺族が直面する「感謝を伝えるまで」の壁セクション
 */
export function PainPointCards() {
	return (
		<section id="pain-points" className="container mx-auto px-4">
			<h2 className="text-2xl font-semibold text-center mb-8">
				なぜ今、香典帳アプリが選ばれるのか？
			</h2>
			<div className="grid gap-8 md:grid-cols-3">
				{points.map((point) => (
					<div
						key={point.title}
						className="p-6 bg-white rounded-lg shadow hover:shadow-lg transform hover:-translate-y-1 transition"
					>
						<point.icon className="h-12 w-12 mx-auto text-primary mb-4" />
						<h3 className="text-xl font-medium mb-2 text-center">{point.title}</h3>
						<p className="text-gray-600 text-center">{point.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
