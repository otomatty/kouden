import type { Metadata } from "next";
import Link from "next/link";
import {
	ChevronRight,
	Cloud,
	BarChart2,
	FileText,
	Monitor,
	Gift,
	Lock,
	LayoutDashboard,
	Timer,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { PageHero } from "../_components/page-hero";

export const metadata: Metadata = {
	title: "機能紹介 | 香典帳",
	description:
		"香典帳アプリの主要機能を詳しく紹介します。手書き管理の手間を解消し、いつでもどこでも安心して利用できます。",
};

export default function FeaturesPage() {
	const features = [
		{
			id: "cloud-sync",
			icon: Cloud,
			title: "クラウド同期",
			description: "出先でも最新データを確認・共有できる",
		},
		{
			id: "auto-calc-graph",
			icon: BarChart2,
			title: "自動計算＆グラフ表示",
			description: "金額ミスを防ぎ、視覚的にデータを把握",
		},
		{
			id: "export",
			icon: FileText,
			title: "Excel/PDF出力",
			description: "帳簿をエクセルやPDFで即エクスポート",
		},
		{
			id: "multi-device",
			icon: Monitor,
			title: "マルチデバイス対応",
			description: "スマホ・PCで共同編集が可能",
		},
		{
			id: "return-management",
			icon: Gift,
			title: "香典返し管理",
			description: "返礼品の情報も一緒に一括管理",
		},
		{
			id: "invite-security",
			icon: Lock,
			title: "招待制セキュリティ",
			description: "招待制で安心のプライバシー保護",
		},
		{
			id: "dedicated-ui",
			icon: LayoutDashboard,
			title: "使いやすいUI",
			description: "香典管理専用のシンプルな操作性",
		},
		{
			id: "free-plan",
			icon: Timer,
			title: "基本利用無料",
			description: "香典情報は何件でも登録可能",
		},
	];

	const testimonials = [
		{
			id: "t1",
			name: "田中様",
			comment: "外出先でも簡単に香典管理ができて助かりました。",
		},
		{
			id: "t2",
			name: "鈴木様",
			comment: "家族とデータ共有できるのが便利！",
		},
	];

	return (
		<div className="space-y-24">
			<PageHero
				title="機能紹介"
				subtitle="香典帳アプリの主要機能を詳しく紹介します"
				cta={{ label: "今すぐ登録", href: "/auth/login", icon: ChevronRight }}
				className="bg-background"
			/>

			<section className="container">
				<SectionTitle
					title="主要な機能"
					subtitle="香典管理の困りごとを一気に解消"
					className="mb-12"
				/>
				<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
					{features.map((feature) => (
						<Link
							key={feature.id}
							href={`/features/${feature.id}`}
							className="block p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
						>
							<feature.icon className="h-8 w-8 text-primary mb-4" />
							<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
							<p className="text-muted-foreground">{feature.description}</p>
						</Link>
					))}
				</div>
			</section>

			<section className="container">
				<SectionTitle title="利用シーン" subtitle="動画で見る使い方" className="mb-12" />
				<div className="flex flex-col md:flex-row gap-8">
					<div className="md:w-1/2">
						{/* TODO: 動画パスを設定 */}
						<div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
							動画デモ
						</div>
					</div>
					<div className="space-y-6 md:w-1/2">
						{testimonials.map((t) => (
							<div key={t.id} className="p-6 rounded-lg border bg-card">
								<p className="text-muted-foreground mb-2">"{t.comment}"</p>
								<p className="text-sm font-medium text-primary">— {t.name}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="text-center container h-[40vh] flex flex-col justify-center">
				<SectionTitle title="さあ、始めましょう" subtitle="" className="mb-8" />
				<Button asChild className="w-fit mx-auto">
					<Link href="/auth/login">
						無料で登録する
						<ChevronRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</section>
		</div>
	);
}
