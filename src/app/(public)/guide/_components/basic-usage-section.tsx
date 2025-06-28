"use client";

import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { VideoPlayer } from "@/components/custom/video-player";
import Image from "next/image";

/**
 * 基本的な使い方を3ステップで表示するセクション
 */
export function BasicUsageSection() {
	const usageSteps = [
		{
			number: "01",
			title: "アカウント作成",
			description: "メールアドレス	でアカウントを作成します。すぐに利用を開始できます。",
			videoSrc: "/videos/guide/step1-account.mp4",
		},
		{
			number: "02",
			title: "香典帳の作成",
			description: "故人の情報や葬儀の詳細を入力して香典帳を作成します。",
			videoSrc: "/videos/guide/step2-create.mp4",
		},
		{
			number: "03",
			title: "香典情報の記録",
			description: "香典を贈った方の情報や金額を記録します。メモ機能で特記事項も残せます。",
			videoSrc: "/videos/guide/step3-record.mp4",
		},
		{
			number: "04",
			title: "返礼品の管理",
			description: "返礼品の選定や送付状況を管理します。地域に応じた相場も確認できます。",
			videoSrc: "/videos/guide/step4-return.mp4",
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
							<VideoPlayer src={step.videoSrc} title={step.title} />
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}
