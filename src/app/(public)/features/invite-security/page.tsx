import type { Metadata } from "next";
import { Lock, UserPlus, Key } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../../_components/cta-section";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { MediaSection } from "../_components/MediaSection";

export const metadata: Metadata = {
	title: "招待制セキュリティ | 機能詳細 | 香典帳",
	description: "招待制セキュリティ機能の詳細ページです。安心して家族間で共有できます。",
};

export default function InviteSecurityPage() {
	const points = [
		{
			title: "招待制アクセス",
			description: "招待されたメンバーのみがデータにアクセス可能です。",
			icon: Lock,
		},
		{
			title: "ロール管理",
			description: "管理者・閲覧者など権限を細かく設定できます。",
			icon: UserPlus,
		},
		{
			title: "安全な認証",
			description: "二要素認証対応でさらにセキュリティ強化。",
			icon: Key,
		},
	];

	return (
		<div className="space-y-8">
			<PageHero
				title="招待制セキュリティ"
				subtitle="招待された人だけアクセス可能"
				className="bg-background"
			/>
			<MediaSection />

			<Section>
				<SectionTitle title="特徴" className="mb-8" />
				<div className="grid md:grid-cols-3 gap-4">
					{points.map((p) => (
						<FeaturePointCard key={p.title} {...p} />
					))}
				</div>
			</Section>

			<Section>
				<SectionTitle title="利用シーン" className="mb-8" />
				<ScenarioVideoWrapper />
			</Section>

			<TestimonialsSection testimonials={testimonials} />

			<OtherFeaturesList currentFeatureId="invite-security" />

			<CTASection />
		</div>
	);
}
