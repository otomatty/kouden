"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
export function BackLink({ label = "戻る" }: BackLinkProps) {
	const router = useRouter();

	return (
		<Button variant="ghost" className="flex items-center gap-2 px-0" onClick={() => router.back()}>
			<ChevronLeft className="h-4 w-4" />
			<span>{label}</span>
		</Button>
	);
}
