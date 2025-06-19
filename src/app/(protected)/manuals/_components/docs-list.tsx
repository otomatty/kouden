"use client";

import { cn } from "@/lib/utils";
import type { DocMeta } from "@/lib/docs";
import { getCategoryName } from "@/lib/docs-config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface DocsListProps {
	docs: DocMeta[];
}

// カテゴリ名は設定ファイルから取得するように変更

function DocsListContent({ docs }: DocsListProps) {
	const pathname = usePathname();
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(docs.map((doc) => doc.category)),
	);

	const categories = docs.reduce<Record<string, DocMeta[]>>((acc, doc) => {
		const category = doc.category;
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(doc);
		return acc;
	}, {});

	const toggleCategory = (category: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(category)) {
			newExpanded.delete(category);
		} else {
			newExpanded.add(category);
		}
		setExpandedCategories(newExpanded);
	};

	return (
		<nav className="space-y-4">
			{Object.entries(categories).map(([category, categoryDocs]) => {
				const isExpanded = expandedCategories.has(category);

				return (
					<div key={category}>
						<Button
							variant="ghost"
							onClick={() => toggleCategory(category)}
							className="w-full justify-between p-2 h-auto font-medium"
						>
							{getCategoryName(category)}
							{isExpanded ? (
								<ChevronDown className="w-4 h-4" />
							) : (
								<ChevronRight className="w-4 h-4" />
							)}
						</Button>

						{isExpanded && (
							<ul className="space-y-1 mt-2">
								{categoryDocs.map((doc) => (
									<li key={doc.slug}>
										<Link
											href={`/manuals/${category}/${doc.slug}`}
											className={cn(
												"block px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors",
												pathname === `/manuals/${category}/${doc.slug}`
													? "bg-accent text-accent-foreground"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											{doc.title}
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				);
			})}
		</nav>
	);
}

export function DocsList({ docs }: DocsListProps) {
	return (
		<>
			{/* デスクトップ版 */}
			<div className="hidden md:block">
				<DocsListContent docs={docs} />
			</div>

			{/* モバイル版 */}
			<div className="md:hidden">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" className="w-full justify-start">
							<Menu className="w-4 h-4 mr-2" />
							メニュー
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-80">
						<SheetHeader>
							<SheetTitle>マニュアル</SheetTitle>
						</SheetHeader>
						<div className="mt-6">
							<DocsListContent docs={docs} />
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</>
	);
}
