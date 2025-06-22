"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTableOfContents } from "@/hooks/use-table-of-contents";

interface TableOfContentsProps {
	content: string;
	className?: string;
	scrollOffset?: number;
}

/**
 * マニュアル用目次コンポーネント
 * MDXコンテンツから目次を生成してアクティブ項目の自動スクロール機能付き
 */
export function TableOfContents({ content, className, scrollOffset = 100 }: TableOfContentsProps) {
	const { tocItems, activeId, tocContainerRef, activeItemRef, handleItemClick } =
		useTableOfContents({
			content,
			scrollOffset,
			extractFromDOM: true, // MDXの場合はDOMから抽出
		});

	if (tocItems.length === 0) {
		return null;
	}

	return (
		<Card className={cn("w-full h-96 overflow-hidden", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<List className="h-4 w-4" />
					目次
				</CardTitle>
			</CardHeader>
			<CardContent
				className="pt-0 h-80 overflow-y-auto scrollbar-hide"
				ref={tocContainerRef}
				style={{
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
			>
				<nav>
					<ul className="space-y-1">
						{tocItems.map((item) => (
							<li key={item.id}>
								<button
									ref={activeId === item.id ? activeItemRef : null}
									type="button"
									onClick={() => handleItemClick(item.id)}
									className={cn(
										"block w-full text-left text-sm transition-colors hover:text-foreground py-1",
										{
											"font-medium": item.level === 1,
											"pl-3": item.level === 2,
											"pl-6": item.level === 3,
											"text-primary font-medium": activeId === item.id,
											"text-muted-foreground": activeId !== item.id,
										},
									)}
								>
									{item.text}
								</button>
							</li>
						))}
					</ul>
				</nav>
			</CardContent>
		</Card>
	);
}
