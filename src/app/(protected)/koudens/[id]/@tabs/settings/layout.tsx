import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
			<div className="hidden md:flex w-full h-full">
				{/* サイドメニュー */}
				<div className="relative">{menu}</div>
				{/* メインコンテンツ */}
				<div className="flex-1 min-w-0">
					<div className="p-6">{contents}</div>
				</div>
			</div>
			{/* モバイル表示: menu, contentsはhidden、childrenのみ表示 */}
			<div className="md:hidden mt-0">{children}</div>
		</>
	);
}
