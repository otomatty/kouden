// Server Actions
import { getKouden } from "@/app/_actions/koudens";
// components
import { TabNavigation } from "../_components/_common/tab-navigation";

interface TabsLayoutProps {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}

/**
 * 香典帳詳細のレイアウトコンポーネント
 * - Parallel Routesを使用して各タブのコンテンツを表示
 * - タブの切り替えはURLの変更で行う
 * - 選択中のタブのコンテンツのみを表示
 */
export default async function TabsLayout({ params, children }: TabsLayoutProps) {
	const { id: koudenId } = await params;
	// 共通で使用するデータを取得
	const [kouden] = await Promise.all([getKouden(koudenId)]);

	return (
		<>
			{/* タブナビゲーション */}
			<TabNavigation id={kouden.id} />
			{/* タブコンテンツ */}
			{children}
		</>
	);
}
