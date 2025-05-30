import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/section-title";

export function CTASection() {
	return (
		<section className="py-24 bg-primary text-primary-foreground">
			<div className="container px-4 md:px-6 mx-auto">
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
						<Link href="/auth/login">
							<Button
								size="lg"
								className="w-full min-[400px]:w-auto bg-white text-primary hover:bg-white/90"
							>
								無料で始める
							</Button>
						</Link>
						<Link href="#features">
							<Button
								size="lg"
								variant="outline"
								className="w-full min-[400px]:w-auto border-white text-white hover:bg-white/10"
							>
								詳しく見る
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
