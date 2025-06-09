import type React from "react";
import { Users, Box, TrendingUp } from "lucide-react";

interface Program {
	title: string;
	target: string;
	value: string;
	details: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const programs: Program[] = [
	{
		title: "カスタマーサポート・パートナー",
		target: "葬儀社様、寺院様",
		value: "ご遺族の負担を軽減し、「感謝されるサポート」を実現します。",
		details: "ご紹介用パンフレットやツールの無償提供、貴社専用特典コードの発行など。",
		icon: Users,
	},
	{
		title: "ソリューション・パートナー",
		target: "ギフトショップ運営事業者様",
		value: "香典返し選びの手間と不安を解消し、感謝の伝わる購買体験を創ります。",
		details: "API連携によるシームレスなデータ連携、商品レコメンド機能の共同開発など。",
		icon: Box,
	},
	{
		title: "ビジネスデベロップメント・パートナー",
		target: "新規事業を模索する企業様、VC様",
		value: "「ライフエンディング・テック」の温かい市場を共に開拓します。",
		details: "資本業務提携を通じた経営連携、新機能・新サービスの共同開発。",
		icon: TrendingUp,
	},
];

/**
 * 貴社のビジネスを成長させるパートナーシップセクション
 */
export function PartnerPrograms() {
	return (
		<section id="partner-programs" className="container mx-auto px-4">
			<h2 className="text-2xl font-semibold text-center mb-8">
				貴社のビジネスを成長させる3つのパートナーシップ
			</h2>
			<div className="grid gap-8 md:grid-cols-3">
				{programs.map((p) => (
					<div
						key={p.title}
						className="p-6 bg-white rounded-lg shadow hover:shadow-lg transform hover:-translate-y-1 transition"
					>
						<p.icon className="h-10 w-10 text-secondary mb-4 mx-auto" />
						<h3 className="text-xl font-medium mb-1">{p.title}</h3>
						<p className="text-sm text-gray-500 mb-2">{p.target}</p>
						<p className="font-medium mb-2">{p.value}</p>
						<p className="text-gray-600">{p.details}</p>
					</div>
				))}
			</div>
		</section>
	);
}
