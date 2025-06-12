"use client";

import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import Image from "next/image";

/**
 * 基本的な使い方を3ステップで表示するセクション
 */
export function BasicUsageSection() {
	const usageSteps = [
		{
			number: "01",
			title: "アカウント作成",
			description: "メールアドレスでアカウントを作成します。すぐに利用を開始できます。",
			imageSrc: "/screenshots/guide/step1-account.png",
			alt: "アカウント作成画面",
		},
		{
			number: "02",
			title: "香典帳の作成",
			description: "故人の情報や葬儀の詳細を入力して香典帳を作成します。",
			imageSrc: "/screenshots/guide/step2-create.png",
			alt: "香典帳作成画面",
		},
		{
			number: "03",
			title: "香典情報の記録",
			description: "香典を贈った方の情報や金額を記録します。メモ機能で特記事項も残せます。",
			imageSrc: "/screenshots/guide/step3-record.png",
			alt: "香典情報記録画面",
		},
		{
			number: "04",
			title: "返礼品の管理",
			description: "返礼品の選定や送付状況を管理します。地域に応じた相場も確認できます。",
			imageSrc: "/screenshots/guide/step4-return.png",
			alt: "返礼品管理画面",
		},
	];

	return (
		<Section className="py-8 md:py-16">
			<SectionTitle title="基本的な使い方" subtitle="4つの簡単なステップで香典管理を始められます" />

			<div className="mt-8 md:mt-12 space-y-10 md:space-y-16">
				{usageSteps.map((step, index) => (
					<div
						key={step.title}
						className={`flex flex-col ${
							index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
						} gap-6 md:gap-8 lg:gap-12 items-center`}
					>
						<div className="flex-1 space-y-3 md:space-y-4">
							<div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary font-medium text-sm md:text-base">
								{step.number}
							</div>
							<h3 className="text-xl md:text-2xl font-semibold">{step.title}</h3>
							<p className="text-muted-foreground text-sm md:text-base">{step.description}</p>
						</div>
						<div className="flex-1 w-full max-w-[500px] mx-auto md:max-w-none">
							<div className="rounded-lg overflow-hidden border shadow-sm">
								<Image
									src={step.imageSrc}
									alt={step.alt}
									width={600}
									height={400}
									className="w-full h-auto"
									sizes="(max-width: 768px) 100vw, 50vw"
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}
