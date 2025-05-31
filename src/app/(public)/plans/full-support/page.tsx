import type { Metadata } from "next";
import HeroSection from "./_components/hero-section";
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
		<main className="container mx-auto px-4 py-12 md:py-16">
			<HeroSection />
			<IncludedFeaturesSection />
			<TargetUsersSection />
			<PricingSection />
			<HowItWorksSection />
			<AppealPointsSection />
			<CtaSection />
		</main>
	);
}
