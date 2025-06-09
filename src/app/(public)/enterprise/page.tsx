import React from "react";
import { EnterpriseHero } from "./_components/enterprise-hero";
import { PainPointCards } from "./_components/pain-point-cards";
import { PartnerPrograms } from "./_components/partner-programs";
import { RoadmapTimeline } from "./_components/roadmap-timeline";
import { SecuritySection } from "./_components/security-section";
import { ContactForm } from "./_components/contact-form";

/**
 * 企業向け紹介ページ
 */
export default function EnterprisePage() {
	return (
		<div className="space-y-20 pt-16 pb-16">
			<EnterpriseHero />
			<PainPointCards />
			<PartnerPrograms />
			<RoadmapTimeline />
			<SecuritySection />
			<ContactForm />
		</div>
	);
}
