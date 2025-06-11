import React from "react";
import { PageHero } from "../_components/page-hero";
import { EnterpriseHero } from "./_components/enterprise-hero";
import { PainPointCards } from "./_components/pain-point-cards";
import { PartnerPrograms } from "./_components/partner-programs";
import { RoadmapTimeline } from "./_components/roadmap-timeline";
import { SecuritySection } from "./_components/security-section";
import CalendarSection from "./_components/calendar-section";

export const dynamic = "force-dynamic";

/**
 * 企業向け紹介ページ
 */
export default function EnterprisePage() {
	return (
		<div className="space-y-20">
			<EnterpriseHero />
			<PainPointCards />
			<PartnerPrograms />
			<RoadmapTimeline />
			<SecuritySection />
			<CalendarSection />
		</div>
	);
}
