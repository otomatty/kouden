import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Users2, Calculator, History } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

type Story = {
	text: string;
	emphasizedWords: string[];
};

type PainPoint = {
	id: string;
	icon: React.ReactNode;
	title: string;
	stories: Story[];
};

const painPoints: PainPoint[] = [
	{
		id: "excel",
		icon: <FileSpreadsheet className="w-10 h-10 text-primary" />,
		title: "Excelの操作に不安がある",
		stories: [
			{
				text: "Excelの使い方がよくわからないので、入力を間違えないか心配",
				emphasizedWords: ["Excel", "入力を間違え"],
			},
			{
				text: "データの保存場所がバラバラになってしまい、管理が大変",
				emphasizedWords: ["保存場所がバラバラ", "管理が大変"],
			},
			{
				text: "テンプレートをダウンロードしても、使い方が複雑で戸惑う",
				emphasizedWords: ["使い方が複雑"],
			},
		],
	},
	{
		id: "sharing",
		icon: <Users2 className="w-10 h-10 text-primary" />,
		title: "家族と情報共有できない",
		stories: [
			{
				text: "家族で分担して記録したいけど、エクセルだと同時に編集できない",
				emphasizedWords: ["同時に編集"],
			},
			{
				text: "スマートフォンでも見られると便利なのに、PCでしか確認できない",
				emphasizedWords: ["スマートフォン", "PCでしか確認できない"],
			},
			{
				text: "急な確認が必要な時に、すぐに情報を共有できない",
				emphasizedWords: ["急な確認", "すぐに情報を共有"],
			},
		],
	},
	{
		id: "calculation",
		icon: <Calculator className="w-10 h-10 text-primary" />,
		title: "返礼品の計算が大変",
		stories: [
			{
				text: "香典の金額に応じて返礼品を決めるのが複雑で時間がかかる",
				emphasizedWords: ["返礼品を決めるのが複雑"],
			},
			{
				text: "計算間違いが心配で、何度も確認が必要",
				emphasizedWords: ["計算間違い", "何度も確認"],
			},
			{
				text: "地域ごとの相場がわからず、適切な返礼品を選べるか不安",
				emphasizedWords: ["地域ごとの相場", "適切な返礼品"],
			},
		],
	},
	{
		id: "history",
		icon: <History className="w-10 h-10 text-primary" />,
		title: "過去の記録をすぐに確認したい",
		stories: [
			{
				text: "以前いただいた香典の記録を探すのに時間がかかる",
				emphasizedWords: ["記録を探す", "時間がかかる"],
			},
			{
				text: "ご家族に不幸があった時に、過去の香典記録をすぐに確認できない",
				emphasizedWords: ["過去の香典記録", "すぐに確認"],
			},
			{
				text: "古い記録が見つからず、適切なお返しができるか心配",
				emphasizedWords: ["古い記録", "適切なお返し"],
			},
		],
	},
];

const StoryText = ({ text, emphasizedWords }: Story) => {
	const parts = text.split(new RegExp(`(${emphasizedWords.join("|")})`, "g"));
	return (
		<li className="text-lg font-medium">
			{parts.map((part) =>
				emphasizedWords.includes(part) ? (
					<span
						key={crypto.randomUUID()}
						className="text-gray-900 dark:text-gray-100 font-semibold"
					>
						{part}
					</span>
				) : (
					part
				),
			)}
		</li>
	);
};

export function PainPointsSection() {
	return (
		<section className="py-64 bg-gray-50 dark:bg-gray-900/50">
			<div className="container px-4 md:px-6">
				<SectionTitle
					title="こんなお困りごとはありませんか？"
					subtitle="香典の管理でよくある悩みをすべて解決します"
					className="mb-12"
				/>
				<div className="grid gap-4 md:grid-cols-2">
					{painPoints.map((point) => (
						<Card key={point.id} className="p-8 space-y-6 hover:shadow-lg transition-shadow">
							<div className="flex items-center gap-4">
								<div className="p-2 bg-primary/10 rounded-lg">{point.icon}</div>
								<h3 className="text-2xl font-bold">{point.title}</h3>
							</div>
							<ul className="text-gray-500 dark:text-gray-400 space-y-4 list-disc pl-6">
								{point.stories.map((story, index) => (
									<StoryText
										key={`${point.id}-story-${index}`}
										text={story.text}
										emphasizedWords={story.emphasizedWords}
									/>
								))}
							</ul>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
