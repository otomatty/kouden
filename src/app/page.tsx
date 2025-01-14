import { HeroSection } from "./_components/hero-section";
import { FeaturesSection } from "./_components/features-section";
import { BenefitsSection } from "./_components/benefits-section";
import { HowItWorksSection } from "./_components/how-it-works";
import { CTASection } from "./_components/cta-section";
import { Header } from "./_components/header";

export default function RootPage() {
	return (
		<>
			<Header />
			<main className="min-h-screen">
				<HeroSection />
				<FeaturesSection />
				<BenefitsSection />
				<HowItWorksSection />
				<CTASection />
			</main>
		</>
	);
}
