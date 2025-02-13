// Server Actions
import { getKouden } from "@/app/_actions/koudens";
// components
import { TabNavigation } from "./_components/tab-navigation";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Suspense } from "react";
import { KoudenRealtimeProvider } from "@/providers/kouden-realtime-provider";

import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";

interface TabsLayoutProps {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}

/**
 * 香典帳詳細のレイアウトコンポーネント
 * - Parallel Routesを使用して各タブのコンテンツを表示
 * - タブの切り替えはURLの変更で行う
 * - 選択中のタブのコンテンツのみを表示
 * - パフォーマンス最適化：
 *   - Suspenseを使用してタブコンテンツのローディングを最適化
 *   - リアルタイム更新のためのコンテキストプロバイダーを提供
 */
export default async function TabsLayout({ params, children }: TabsLayoutProps) {
	const { id: koudenId } = await params;
	// 共通で使用するデータを取得（キャッシュを有効化）
	const [kouden, entries, relationships] = await Promise.all([
		getKouden(koudenId),
		getEntries(koudenId),
		getRelationships(koudenId),
	]);

	return (
		<KoudenRealtimeProvider koudenId={kouden.id}>
			{/* タブナビゲーション（デスクトップのみ） */}
			<div className="hidden md:block">
				<TabNavigation id={kouden.id} />
			</div>
			{/* タブコンテンツ */}
			<div className="min-h-[calc(100vh-10rem)]">{children}</div>
			{/* ボトムナビゲーション（モバイルのみ） */}
			<BottomNavigation id={kouden.id} entries={entries} relationships={relationships} />
		</KoudenRealtimeProvider>
	);
}
