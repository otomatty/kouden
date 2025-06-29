import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function SEOBreadcrumbs({ items, className = "" }: BreadcrumbsProps) {
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			...(item.href && { item: `${process.env.NEXT_PUBLIC_APP_URL}${item.href}` }),
		})),
	};

	return (
		<>
			{/* 構造化データ */}
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>

			{/* パンくずナビゲーション */}
			<nav
				aria-label="パンくず"
				className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}
			>
				{items.map((item, index) => (
					<div key={item.label} className="flex items-center">
						{index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
						{item.href ? (
							<Link
								href={item.href}
								className="hover:text-primary transition-colors"
								{...(index === items.length - 1 && { "aria-current": "page" })}
							>
								{item.label}
							</Link>
						) : (
							<span className="text-foreground font-medium">{item.label}</span>
						)}
					</div>
				))}
			</nav>
		</>
	);
}
