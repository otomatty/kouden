import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export default function CtaSection() {
	return (
		<Section className="text-center">
			<h2 className="text-2xl md:text-3xl font-semibold mb-4">まずはお気軽にご相談ください</h2>
			<p className="text-muted-foreground mb-8 max-w-xl mx-auto">
				あなたの状況に合わせて最適なサポートをご提案します。
				<br />
				下のボタンからお問い合わせフォームに進み、お困りごとをお聞かせください。
			</p>
			<Button size="lg" asChild>
				<Link href="/contact">お問い合わせ・お申し込みはこちら</Link>
			</Button>
		</Section>
	);
}
