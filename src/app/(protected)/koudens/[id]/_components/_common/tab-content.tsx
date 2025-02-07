"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { koudenTabAtom, type KoudenTab } from "@/store/kouden-tab";

interface TabContentProps {
	tab: KoudenTab;
	children: React.ReactNode;
}

/**
 * タブコンテンツを表示するコンポーネント
 * - 選択中のタブのコンテンツのみを表示
 * - クライアントコンポーネントとして実装
 */
export function TabContent({ tab, children }: TabContentProps) {
	const [activeTab] = useAtom(koudenTabAtom);

	if (tab !== activeTab) return null;

	return (
		<div key={`${tab}`}>
			<Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
		</div>
	);
}
