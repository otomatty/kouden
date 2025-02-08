/**
 * 設定画面のデフォルトコンテンツ
 * - 設定項目が選択されていない場合に表示
 */
export default function DefaultContent() {
	return (
		<div className="flex h-full items-center justify-center text-muted-foreground">
			<p>左のメニューから設定項目を選択してください</p>
		</div>
	);
}
