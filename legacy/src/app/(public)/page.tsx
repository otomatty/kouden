import { HeroSection } from "./_components/hero-section";
import { PainPointsSection } from "./_components/pain-points-section";
import { FeaturesSection } from "./_components/features-section";
import { BenefitsSection } from "./_components/benefits-section";
import { HowItWorksSection } from "./_components/how-it-works";
import { CTASection } from "./_components/cta-section";
import { FAQSection } from "./_components/faq-section";
import { KoudenAppStructuredData, OrganizationStructuredData } from "@/components/structured-data";

// ホームページ固有のFAQデータ
const homeFaqs = [
	{
		id: "home-1",
		question: "香典帳アプリとは何ですか？",
		answer: "香典帳アプリは、手書き帳簿をデジタル化し、効率的に管理できるツールです。",
	},
	{
		id: "home-2",
		question: "無料プランで使用できる機能は？",
		answer: "無料プランでは、基本的な記帳、PDFエクスポート、クラウド同期が利用可能です。",
	},
	{
		id: "home-3",
		question: "データは安全に保管されますか？",
		answer: "Supabaseによるリアルタイムバックアップで常に安全に保管されます。",
	},
];

export default function RootPage() {
	return (
		<>
			<KoudenAppStructuredData />
			<OrganizationStructuredData />
			<HeroSection />
			<PainPointsSection />
			<FeaturesSection />
			<BenefitsSection />
			<HowItWorksSection />
			<FAQSection faqs={homeFaqs} />
			<CTASection />
		</>
	);
}
