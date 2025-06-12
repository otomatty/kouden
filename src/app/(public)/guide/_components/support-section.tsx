import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

/**
 * サポート情報セクション
 */
export function SupportSection() {
	return (
		<Section className="text-center">
			<SectionTitle
				title="サポート"
				subtitle="ご不明な点がございましたら、お気軽にお問い合わせください"
				className="mb-8"
			/>
			<Button asChild variant="outline">
				<Link href="/contact">
					お問い合わせ
					<ChevronRight className="ml-2 h-4 w-4" />
				</Link>
			</Button>
		</Section>
	);
}
