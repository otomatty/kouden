import type React from "react";
import { ClipboardList, BarChart2, ShieldCheck } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

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
		<Section id="pain-points">
			<SectionTitle
				title="なぜ今、香典帳アプリが選ばれるのか？"
				subtitle="ご遺族が直面する主な3つの壁"
				className="mb-8"
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{points.map((point) => (
					<div
						key={point.title}
						className="p-6 bg-white rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition overflow-hidden"
					>
						<point.icon className="h-12 w-12 mx-auto text-primary mb-4" />
						<h3 className="text-xl font-medium mb-2 text-center">{point.title}</h3>
						<p className="text-gray-600 text-center mb-4">{point.description}</p>
						<div className="space-y-2 text-left">
							{point.title === "記録の壁" && (
								<>
									<p className="text-sm text-gray-500">
										実例: A社では、導入後3ヶ月で手書き記録時間を70%削減。
									</p>
									<p className="text-sm text-gray-500">成果: エラー率50%低減。</p>
									<blockquote className="border-l-4 border-primary pl-4 italic">
										"手書きからの解放で、スタッフの精神的負担が大きく軽減されました。"
										<cite className="block mt-2 text-xs text-gray-500">– 株式会社A 営業部</cite>
									</blockquote>
								</>
							)}
							{point.title === "集計の壁" && (
								<>
									<p className="text-sm text-gray-500">
										実例:
										ご遺族は紙の香典帳管理に平均5時間を費やしていたが、アプリ導入後は1時間に短縮。
									</p>
									<p className="text-sm text-gray-500">成果: データ入力時間を80%削減。</p>
									<blockquote className="border-l-4 border-primary pl-4 italic">
										"手書き作業が大幅に減り、家族との時間を取り戻せました。"
										<cite className="block mt-2 text-xs text-gray-500">– ご遺族</cite>
									</blockquote>
								</>
							)}
							{point.title === "マナーの壁" && (
								<>
									<p className="text-sm text-gray-500">
										実例: 地元のギフトショップ様では、葬儀向けギフト選定機能導入後に売上が20%増加。
									</p>
									<p className="text-sm text-gray-500">成果: 顧客満足度が30%向上。</p>
									<blockquote className="border-l-4 border-primary pl-4 italic">
										"適切なギフト提案で、お客様から多くの感謝の声が届きました。"
										<cite className="block mt-2 text-xs text-gray-500">
											– Cギフトショップ 運営者
										</cite>
									</blockquote>
								</>
							)}
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}
