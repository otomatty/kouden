import React from "react";

interface Phase {
	title: string;
	theme: string;
	description: string;
}

const phases: Phase[] = [
	{
		title: "Phase 1：負担からの解放",
		theme: "心と時間のゆとりを。",
		description: "煩雑な香典管理の完全デジタル化。",
	},
	{
		title: "Phase 2：感謝を伝える準備",
		theme: "失礼なく、スマートに感謝を伝える準備を。",
		description: "挨拶状の文例サジェスト、贈答マナーのナビゲーション、関係性メモ機能。",
	},
	{
		title: "Phase 3：繋がりを育む",
		theme: "一度きりで終わらない、良好な人間関係へ。",
		description: "記念日リマインダー、AIギフト提案、年賀状・贈答リストへの活用。",
	},
];

/**
 * アプリのロードマップセクション
 */
export function RoadmapTimeline() {
	return (
		<section id="roadmap" className="container mx-auto px-4">
			<h2 className="text-2xl font-semibold text-center mb-8">
				私たちの目指す未来：アプリのロードマップ
			</h2>
			<ol className="relative flex flex-col md:flex-row justify-between">
				{/* Timeline line for desktop */}
				<div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-gray-200" />
				{phases.map((phase, idx) => (
					<li key={phase.title} className="relative flex-1 mb-8 md:mb-0 md:mx-2">
						{/* Number badge */}
						<div className="absolute -top-3 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 md:relative md:top-0 md:ml-2">
							<div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-bold">
								{idx + 1}
							</div>
						</div>
						<div className="mt-6 md:mt-3 p-6 bg-white rounded-lg shadow">
							<h3 className="text-lg font-medium mb-1">{phase.title}</h3>
							<p className="italic text-gray-500 mb-2">{phase.theme}</p>
							<p className="text-gray-600">{phase.description}</p>
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
