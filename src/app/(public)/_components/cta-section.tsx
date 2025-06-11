import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

export function CTASection() {
	return (
		<Section bgClassName="bg-primary text-primary-foreground" className="py-24">
			<div className="flex flex-col items-center space-y-4">
				<SectionTitle
					title="今すぐ始めましょう"
					subtitle="香典帳の管理をより簡単に、より効率的に。無料でアカウントを作成して、すぐに使い始めることができます。"
					className="text-primary-foreground [&_p]:text-primary-foreground/80"
				/>
				<p className="text-sm text-primary-foreground/60">
					※ ご利用にはメールアドレスまたはGoogleアカウントでのログインが必要です
				</p>
				<div className="flex flex-col gap-2 min-[400px]:flex-row">
					<Button
						size="lg"
						className="w-full min-[400px]:w-auto bg-white text-primary hover:bg-white/90"
						asChild
					>
						<Link href="/auth/login">無料で始める</Link>
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="w-full min-[400px]:w-auto bg-primary border-white text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
						asChild
					>
						<Link href="/features">機能を見る</Link>
					</Button>
				</div>
			</div>
		</Section>
	);
}
