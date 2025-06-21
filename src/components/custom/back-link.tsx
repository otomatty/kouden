"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BackLinkProps {
	/**
	 * 表示するテキスト
	 * @default "戻る"
	 * @example
	 * ```tsx
	 * <BackLink label="戻る" />
	 * ```
	 */
	label?: string;
	/**
	 * リンク先のURL
	 * @default "/"
	 * @example
	 * ```tsx
	 * <BackLink href="/admin/works" />
	 * ```
	 */
	href?: string;
}

/**
 * 前のページに戻るためのリンクコンポーネント
 * @param label - 表示するテキスト（デフォルト: "戻る"）
 */
export function BackLink({ label = "戻る", href = "/" }: BackLinkProps) {
	return (
		<Button variant="ghost" asChild>
			<Link
				href={href}
				className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
			>
				<ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
				{label}
			</Link>
		</Button>
	);
}
