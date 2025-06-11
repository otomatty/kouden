import React from "react";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

interface Phase {
	title: string;
	theme: string;
	features: string[];
}

const phases: Phase[] = [
	{
		title: "Phase 1：負担からの解放",
		theme: "心と時間のゆとりを。",
		features: [
			"煩雑な香典管理の完全デジタル化",
			"QRコードでの迅速なデータ登録",
			"PDFエクスポート・自動レポート生成",
		],
	},
	{
		title: "Phase 2：感謝を伝える準備",
		theme: "失礼なく・スマートに感謝を。",
		features: [
			"挨拶状文例のAIサジェスト",
			"贈答マナーと関係性メモ機能",
			"テンプレート一括ダウンロード",
		],
	},
	{
		title: "Phase 3：繋がりを育む",
		theme: "一度きりで終わらない良好な人間関係へ。",
		features: [
			"記念日リマインダー・通知機能",
			"AIによるギフト提案エンジン",
			"年賀状・贈答リスト連携",
		],
	},
];

/**
 * アプリのロードマップセクション
 */
export function RoadmapTimeline() {
	return (
		<Section id="roadmap">
			<SectionTitle
				title="私たちの目指す未来：アプリのロードマップ"
				subtitle="機能開発のステップをご覧ください"
				className="mb-12"
			/>
			<ol className="relative flex flex-col md:flex-row justify-between">
				{/* Timeline line for desktop */}
				<div className="hidden md:block absolute top-4 left-0 right-0 h-1 bg-primary" />
				{phases.map((phase, idx) => (
					<li key={phase.title} className="relative flex-1 mb-12 md:mb-0 md:mx-4">
						{/* Number badge */}
						<div className="absolute -top-4 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 md:relative md:top-0 md:ml-2">
							<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
								{idx + 1}
							</div>
						</div>
						<div className="mt-8 md:mt-4 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-primary">
							<h3 className="text-xl md:text-2xl font-bold mb-2">{phase.title}</h3>
							<p className="italic text-gray-500 mb-4">{phase.theme}</p>
							<ul className="list-disc list-inside text-gray-600 space-y-2">
								{phase.features.map((f) => (
									<li key={f}>{f}</li>
								))}
							</ul>
						</div>
					</li>
				))}
			</ol>
		</Section>
	);
}
