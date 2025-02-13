import {
	BookOpen,
	Gift,
	Map as MapIcon,
	Users,
	Search,
	Share2,
	Calculator,
	Smartphone,
	Bell,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { SectionTitle } from "@/components/ui/section-title";

const features = [
	{
		id: "digital-management",
		Icon: BookOpen,
		name: "シンプルな記録機能",
		description:
			"直感的な操作で香典の記録が可能。入力項目も必要最小限に抑え、スムーズな記録をサポートします。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-2",
		background: (
			<div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
		),
	},
	{
		id: "gift-management",
		Icon: Gift,
		name: "返礼品の自動提案",
		description:
			"金額や地域に応じて最適な返礼品を自動で提案。贈答の相場も確認できるので、迷うことなく選べます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "search",
		Icon: Search,
		name: "スマートな検索機能",
		description:
			"名前や日付、金額など、あらゆる条件で過去の記録を瞬時に検索。必要な情報にすぐにアクセスできます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "sharing",
		Icon: Share2,
		name: "家族との共有機能",
		description:
			"家族や親族と記録を共有可能。リアルタイムで情報を更新でき、常に最新の状態を保てます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "calculation",
		Icon: Calculator,
		name: "返礼品の計算機能",
		description:
			"香典の金額から適切な返礼品の価格を自動計算。地域ごとの相場も考慮して、最適な返礼品を提案します。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-2",
		background: (
			<div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
		),
	},
	{
		id: "mobile",
		Icon: Smartphone,
		name: "マルチデバイス対応",
		description:
			"スマートフォンやタブレット、PCなど、どの端末からでもアクセス可能。外出先でも簡単に確認・記録できます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "notification",
		Icon: Bell,
		name: "リマインダー機能",
		description:
			"返礼品の準備時期や配送予定日をお知らせ。大切なタイミングを逃さず、適切なお返しができます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "relationship",
		Icon: Users,
		name: "ご縁の管理機能",
		description:
			"過去の贈答履歴や関係性を記録。突然の不幸があった際にも、過去の記録を確認してすぐに対応できます。",
		href: "#",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
];

export function FeaturesSection() {
	return (
		<section id="features" className="py-64 bg-background">
			<div className="container px-4 md:px-6 mx-auto">
				<SectionTitle
					title="不安を解決するための機能"
					subtitle="初めての方でも安心して使える、シンプルで便利な機能"
					className="mb-16"
				/>
				<BentoGrid className="auto-rows-[20rem] md:auto-rows-[25rem]">
					{features.map((feature) => (
						<BentoCard key={feature.id} {...feature} />
					))}
				</BentoGrid>
			</div>
		</section>
	);
}
