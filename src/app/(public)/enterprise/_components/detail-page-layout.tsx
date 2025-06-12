import type { ReactNode } from "react";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { PageHero } from "../../_components/page-hero";

interface DetailPageLayoutProps {
	title: string;
	subtitle: string;
	contentTitle: string;
	contentSubtitle: string;
	children: [ReactNode, ReactNode];
	imagePosition?: "left" | "right";
	heroClassName?: string;
}

/**
 * 詳細ページの共通レイアウトを提供するコンポーネント
 */
export function DetailPageLayout({
	title,
	subtitle,
	contentTitle,
	contentSubtitle,
	children,
	imagePosition = "right",
	heroClassName = "bg-gradient-to-br from-gray-50 to-gray-100",
}: DetailPageLayoutProps) {
	return (
		<>
			<PageHero title={title} subtitle={subtitle} className={heroClassName} />

			<Section>
				<div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
					{imagePosition === "left" ? (
						<>
							{/* 左側に画像、右側にコンテンツ */}
							<div className="order-2 md:order-1 w-full max-w-[600px] mx-auto md:max-w-none">
								{children[0]}
							</div>
							<div className="order-1 md:order-2">
								<SectionTitle
									title={contentTitle}
									subtitle={contentSubtitle}
									className="text-left mb-6 md:mb-8"
								/>
								{children[1]}
							</div>
						</>
					) : (
						<>
							{/* 左側にコンテンツ、右側に画像 */}
							<div className="order-1 md:order-1">
								<SectionTitle
									title={contentTitle}
									subtitle={contentSubtitle}
									className="text-left mb-6 md:mb-8"
								/>
								{children[1]}
							</div>
							<div className="order-2 md:order-2 w-full max-w-[600px] mx-auto md:max-w-none">
								{children[0]}
							</div>
						</>
					)}
				</div>
			</Section>
		</>
	);
}
