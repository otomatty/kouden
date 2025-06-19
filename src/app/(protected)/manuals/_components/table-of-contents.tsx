"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
	toc: TocItem[];
	className?: string;
}

export function TableOfContents({ toc, className }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState<string>("");
	const [isCollapsed, setIsCollapsed] = useState(false);

	// スクロール位置に基づいてアクティブな見出しを更新
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
					}
				}
			},
			{
				rootMargin: "-80px 0px -80% 0px",
			},
		);

		// 全ての見出し要素を観察
		for (const item of toc) {
			const element = document.getElementById(item.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [toc]);

	if (toc.length === 0) {
		return null;
	}

	const handleClick = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	return (
		<Card className={cn("sticky top-4", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<List className="w-4 h-4" />
						目次
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="h-6 w-6 p-0"
					>
						{isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
					</Button>
				</div>
			</CardHeader>
			{!isCollapsed && (
				<CardContent className="pt-0">
					<nav className="space-y-1">
						{toc.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => handleClick(item.id)}
								className={cn(
									"block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
									activeId === item.id && "bg-accent text-accent-foreground font-medium",
									item.level === 1 && "font-medium",
									item.level === 2 && "pl-4",
									item.level === 3 && "pl-6 text-xs",
									item.level === 4 && "pl-8 text-xs",
									item.level >= 5 && "pl-10 text-xs",
								)}
							>
								{item.title}
							</button>
						))}
					</nav>
				</CardContent>
			)}
		</Card>
	);
}
