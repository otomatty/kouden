interface SettingsLayoutProps {
	menu: React.ReactNode;
	content: React.ReactNode;
}

/**
 * 設定画面のレイアウトコンポーネント
 * - サイドメニューとコンテンツエリアを横並びに配置
 */
export default function SettingsLayout({ menu, content }: SettingsLayoutProps) {
	return (
		<div className="flex h-full">
			<div className="w-60 py-6 border-r">{menu}</div>
			<div className="flex-1 p-6">{content}</div>
		</div>
	);
}
