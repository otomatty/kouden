import { getGuideVisibility } from "@/app/_actions/settings";

interface KoudensLayoutProps {
	children: React.ReactNode;
	guide: React.ReactNode;
}

/**
 * 香典帳一覧のレイアウトコンポーネント
 * - ガイドの表示/非表示を制御
 * - 子コンポーネントのレイアウトを管理
 */
export default async function KoudensLayout({ children, guide }: KoudensLayoutProps) {
	const showGuide = await getGuideVisibility();

	return (
		<div className="space-y-12">
			{showGuide && guide}
			{children}
		</div>
	);
}
