interface SettingsHeaderProps {
	title: string;
	description: string;
}

/**
 * 設定ページの共通ヘッダーコンポーネント
 * - タイトルと説明文を表示
 * - 一貫したデザインを提供
 */
export function SettingsHeader({ title, description }: SettingsHeaderProps) {
	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	);
}
