import { HeroSection } from "./_components/hero-section";
import { PainPointsSection } from "./_components/pain-points-section";
import { FeaturesSection } from "./_components/features-section";
import { BenefitsSection } from "./_components/benefits-section";
import { HowItWorksSection } from "./_components/how-it-works";
import { CTASection } from "./_components/cta-section";

export default function RootPage() {
	return (
		<>
			<HeroSection />
			<PainPointsSection />
			<FeaturesSection />
			<BenefitsSection />
			<HowItWorksSection />
			<CTASection />
		</>
	);
}
