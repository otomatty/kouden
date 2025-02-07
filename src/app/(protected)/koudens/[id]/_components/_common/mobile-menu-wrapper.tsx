"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { MobileMenu } from "./mobile-menu";

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";

interface MobileMenuWrapperProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
}

/**
 * モバイルメニューのラッパーコンポーネント
 * - クライアントサイドでセグメントを取得するために使用
 */
export function MobileMenuWrapper({ koudenId, entries, relationships }: MobileMenuWrapperProps) {
	const segment = useSelectedLayoutSegment();
	return (
		<MobileMenu
			koudenId={koudenId}
			segment={segment}
			entries={entries}
			relationships={relationships}
		/>
	);
}
