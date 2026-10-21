import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { zenOldMincho } from "@/app/fonts";

interface CTAButton {
	label: string;
	href: string;
	icon?: LucideIcon;
}

interface PageHeroProps {
	title: string;
	subtitle: string;
	cta?: CTAButton;
	secondaryCta?: CTAButton;
	className?: string;
}

/**
 * ページのヒーローセクションコンポーネント
 */
export function PageHero({ title, subtitle, cta, secondaryCta, className = "" }: PageHeroProps) {
	return (
		<div className={`px-4 py-12 md:py-20 text-center bg-background ${className}`}>
			<div className="container max-w-4xl mx-auto">
				<h1
					className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 md:mb-4 ${zenOldMincho.className}`}
				>
					{title}
				</h1>
				<p className="text-lg md:text-xl text-muted-foreground mx-auto max-w-2xl mb-6 md:mb-8">
					{subtitle}
				</p>

				{(cta || secondaryCta) && (
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						{cta && (
							<Button asChild size="lg" className="flex items-center gap-2">
								<Link href={cta.href}>
									{cta.label}
									{cta.icon && <cta.icon className="h-4 w-4 ml-1" />}
								</Link>
							</Button>
						)}
						{secondaryCta && (
							<Button asChild variant="outline" size="lg" className="flex items-center gap-2">
								<Link href={secondaryCta.href}>
									{secondaryCta.label}
									{secondaryCta.icon && <secondaryCta.icon className="h-4 w-4 ml-1" />}
								</Link>
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
