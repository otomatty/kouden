import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PageHeroProps = {
	title: string;
	subtitle: string;
	/**
	 * CTAボタンの設定
	 */
	cta?: {
		label: string;
		href: string;
		icon?: React.ComponentType<{ className?: string }>;
	};
	/**
	 * 追加のCTAボタン（アウトライン）
	 */
	secondaryCta?: {
		label: string;
		href: string;
		icon?: React.ComponentType<{ className?: string }>;
	};
	/**
	 * 背景色のカスタマイズ
	 */
	className?: string;
};

export function PageHero({ title, subtitle, cta, secondaryCta, className }: PageHeroProps) {
	return (
		<section className={cn("py-16 md:py-24", className)}>
			<div className="container mx-auto px-4 md:px-6">
				<div className="text-center space-y-8">
					<SectionTitle title={title} subtitle={subtitle} className="mx-auto max-w-3xl" />
					{(cta || secondaryCta) && (
						<div className="flex flex-wrap justify-center gap-4">
							{cta && (
								<Button asChild>
									<Link href={cta.href}>
										{cta.label}
										{cta.icon ? (
											<cta.icon className="ml-2 h-4 w-4" />
										) : (
											<ChevronRight className="ml-2 h-4 w-4" />
										)}
									</Link>
								</Button>
							)}
							{secondaryCta && (
								<Button asChild variant="outline">
									<Link href={secondaryCta.href}>
										{secondaryCta.label}
										{secondaryCta.icon ? (
											<secondaryCta.icon className="ml-2 h-4 w-4" />
										) : (
											<ChevronRight className="ml-2 h-4 w-4" />
										)}
									</Link>
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
