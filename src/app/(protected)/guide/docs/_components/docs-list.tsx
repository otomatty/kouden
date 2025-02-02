"use client";

import { cn } from "@/lib/utils";
import type { DocMeta } from "@/lib/docs";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DocsListProps {
	docs: DocMeta[];
}

const categoryNames = {
	"getting-started": "はじめに",
	features: "機能説明",
	faq: "よくある質問",
};

export function DocsList({ docs }: DocsListProps) {
	const pathname = usePathname();
	const categories = docs.reduce<Record<string, DocMeta[]>>((acc, doc) => {
		const category = doc.category;
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(doc);
		return acc;
	}, {});

	return (
		<nav className="space-y-6">
			{Object.entries(categories).map(([category, categoryDocs]) => (
				<div key={category}>
					<h3 className="font-medium mb-2">
						{categoryNames[category as keyof typeof categoryNames]}
					</h3>
					<ul className="space-y-1">
						{categoryDocs.map((doc) => (
							<li key={doc.slug}>
								<Link
									href={`/guide/docs/${category}/${doc.slug}`}
									className={cn(
										"block px-3 py-1.5 text-sm rounded-md hover:bg-accent",
										pathname === `/guide/docs/${category}/${doc.slug}`
											? "bg-accent"
											: "text-muted-foreground",
									)}
								>
									{doc.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
