"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionMDXProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
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
				"rounded-lg mb-6 overflow-hidden border border-border bg-background",
				className,
			)}
		>
			{/* ヘッダー部分 */}
			<button
				type="button"
				id={accordionId}
				className="w-full px-4 py-3 text-left font-medium flex items-center justify-between transition-colors focus:outline-none hover:bg-muted/50"
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
					className="px-4 pb-4 border-t border-border animate-in slide-in-from-top-2 duration-200"
					aria-labelledby={accordionId}
				>
					<div className="pt-3 prose prose-sm max-w-none dark:prose-invert">{children}</div>
				</section>
			)}
		</div>
	);
}
