"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionMDXProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	variant?: "default" | "bordered" | "filled";
	className?: string;
}

/**
 * MDX内で使用可能なアコーディオンコンポーネント
 *
 * @example
 * ```mdx
 * <Accordion title="詳細情報" defaultOpen={false}>
 *   ここに折りたたみたいコンテンツを記述
 * </Accordion>
 * ```
 */
export function AccordionMDX({
	title,
	children,
	defaultOpen = false,
	variant = "default",
	className,
}: AccordionMDXProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const handleToggle = () => {
		setIsOpen(!isOpen);
	};

	// キーボード操作のハンドリング
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleToggle();
		}
	};

	const accordionId = `accordion-${Math.random().toString(36).substr(2, 9)}`;
	const contentId = `accordion-content-${accordionId}`;

	return (
		<div
			className={cn(
				"rounded-lg mb-6 overflow-hidden",
				{
					"border border-border bg-background": variant === "default",
					"border-2 border-primary/20 bg-primary/5": variant === "bordered",
					"bg-muted/50 border border-muted-foreground/20": variant === "filled",
				},
				className,
			)}
		>
			{/* ヘッダー部分 */}
			<button
				type="button"
				id={accordionId}
				className={cn(
					"w-full px-4 py-3 text-left font-medium flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
					{
						"hover:bg-muted/50": variant === "default",
						"hover:bg-primary/10": variant === "bordered",
						"hover:bg-muted/70": variant === "filled",
					},
				)}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				aria-expanded={isOpen}
				aria-controls={contentId}
				tabIndex={0}
			>
				<span className="text-sm font-semibold text-foreground">{title}</span>
				<ChevronDown
					className={cn("w-4 h-4 transition-transform duration-200 text-muted-foreground", {
						"rotate-180": isOpen,
					})}
					aria-hidden="true"
				/>
			</button>

			{/* コンテンツ部分 */}
			{isOpen && (
				<section
					id={contentId}
					className={cn("px-4 pb-4 border-t animate-in slide-in-from-top-2 duration-200", {
						"border-border": variant === "default",
						"border-primary/20": variant === "bordered",
						"border-muted-foreground/20": variant === "filled",
					})}
					aria-labelledby={accordionId}
				>
					<div className="pt-3 prose prose-sm max-w-none dark:prose-invert">{children}</div>
				</section>
			)}
		</div>
	);
}
