import type { ReactNode } from "react";

interface SettingsLayoutProps {
	children: ReactNode;
	menu: ReactNode;
	contents: ReactNode;
}

/**
 * 設定画面のレイアウトコンポーネント
 * - デスクトップではサイドメニューとコンテンツエリアを横並びに配置
 * - モバイルではchildrenのみ表示
 */
export default function SettingsLayout({ children, menu, contents }: SettingsLayoutProps) {
	return (
		<>
			{/* デスクトップ表示: menuとcontentsを表示、モバイルではhidden */}
			<div className="hidden md:flex h-full">
				<div className="w-60 py-6 border-r">{menu}</div>
				<div className="flex-1 p-6">{contents}</div>
			</div>

			{/* モバイル表示: menu, contentsはhidden、childrenのみ表示 */}
			<div className="md:hidden">{children}</div>
		</>
	);
}
