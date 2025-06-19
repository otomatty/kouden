import type { Metadata } from "next";
import { BackLink } from "@/components/custom/BackLink";
import Container from "@/components/ui/container";
import {
	HeroSection,
	DevelopmentStorySection,
	PersonalDevelopmentBenefitsSection,
	DeveloperMessageSection,
	DeveloperInfoSection,
} from "./_components";

export const metadata: Metadata = {
	title: "開発者情報 | 香典帳",
	description: "香典帳アプリの開発者情報について",
};

export default function DevelopersPage() {
	return (
		<Container className="py-8 max-w-5xl mx-auto">
			<BackLink />
			<div className="mt-8 space-y-8">
				<HeroSection />
				<DevelopmentStorySection />
				<PersonalDevelopmentBenefitsSection />
				<DeveloperMessageSection />
				<DeveloperInfoSection />
			</div>
		</Container>
	);
}
