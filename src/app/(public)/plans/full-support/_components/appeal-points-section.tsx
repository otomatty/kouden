import { CheckCircle2 } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";

export default function AppealPointsSection() {
	return (
		<Section className="mb-12 md:mb-16 bg-primary-foreground p-6 md:p-8 rounded-lg">
			<SectionTitle
				title="このプランの魅力"
				subtitle="「ITは分かるけど、今は誰かに頼りたい」「AIによる効率化」と「人の手による安心のサポート」のハイブリッドで、時間的・精神的負担を極限まで軽減します。"
				className="mb-12"
			/>
			<div className="space-y-4">
				<p className="text-center text-lg">
					「ITは分かるけど、今は誰かに頼りたい」
					<br />
					「AIによる効率化」と「人の手による安心のサポート」のハイブリッドで、
					<br />
					時間的・精神的負担を極限まで軽減します。
				</p>
				<ul className="grid md:grid-cols-2 gap-4 text-sm">
					<li className="flex items-start space-x-2">
						<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>
							単なる入力代行ではなく、ご自身も操作を理解しながら、プロと一緒に確実に作業を完了できます。
						</span>
					</li>
					<li className="flex items-start space-x-2">
						<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>
							ビデオ通話で顔を見ながらの対話形式なので、細かなニュアンスや疑問もその場で解消できます。
						</span>
					</li>
					<li className="flex items-start space-x-2">
						<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>
							「忙しい」「疲れている」「でも、きちんとしたい」そんなあなたに最適な、パーソナルサポートです。
						</span>
					</li>
					<li className="flex items-start space-x-2">
						<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>大切な時間を、故人を偲ぶ時間や他の手続きに集中できるようお手伝いします。</span>
					</li>
				</ul>
			</div>
		</Section>
	);
}
