import type { Metadata } from "next";
import { PageHero } from "../../_components/page-hero";
import IncludedFeaturesSection from "./_components/included-features-section";
import TargetUsersSection from "./_components/target-users-section";
import PricingSection from "./_components/pricing-section";
import HowItWorksSection from "./_components/how-it-works-section";
import AppealPointsSection from "./_components/appeal-points-section";
import CtaSection from "./_components/cta-section";

export const metadata: Metadata = {
	title: "フルサポートプラン - 香典帳アプリ",
	description:
		"専門家がマンツーマンでサポート。香典管理を安心して、確実に完了したいあなたのためのフルサポートプランです。",
};

export default function FullSupportPage() {
	return (
		<>
			<PageHero
				title="フルサポートプラン"
				subtitle="専門家がマンツーマンでサポート。香典管理を安心して、確実に完了したいあなたのためのフルサポートプランです。"
			/>
			<IncludedFeaturesSection />
			<TargetUsersSection />
			<PricingSection />
			<HowItWorksSection />
			<AppealPointsSection />
			<CtaSection />
		</>
	);
}
