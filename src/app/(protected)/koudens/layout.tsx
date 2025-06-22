interface KoudensLayoutProps {
	children: React.ReactNode;
}

/**
 * 香典帳一覧のレイアウトコンポーネント
 * - ガイドの表示/非表示を制御
 * - 子コンポーネントのレイアウトを管理
 */
export default async function KoudensLayout({ children }: KoudensLayoutProps) {
	return <>{children}</>;
}
