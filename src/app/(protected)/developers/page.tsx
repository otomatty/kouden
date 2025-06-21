import type { Metadata } from "next";
import { BackLink } from "@/components/custom/back-link";
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
			<BackLink href="/" label="トップページに戻る" />
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
