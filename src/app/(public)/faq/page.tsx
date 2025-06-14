import type { Metadata } from "next";
import FAQClient from "./_components/FAQClient";
import { PageHero } from "../_components/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
	title: "よくある質問 | 香典帳",
	description: "アプリの使用中によくある質問とその回答をまとめています",
};

export default function FAQPage() {
	return (
		<>
			<PageHero
				title="よくある質問"
				subtitle="アプリの使用中によくある質問とその回答をまとめています"
				className="bg-muted"
			/>
			<Section maxWidthClassName="max-w-5xl" className="bg-background">
				<FAQClient />
			</Section>
		</>
	);
}
