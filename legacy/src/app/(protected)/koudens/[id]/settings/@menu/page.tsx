"use server";

import { SettingsMenu } from "./_components/settings-menu";

interface SettingsMenuPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 設定画面のメニューページ
 * - クライアントコンポーネントのSettingsMenuをラップ
 * - Next.js 15: paramsはPromiseとして扱う
 */
export default async function SettingsMenuPage({ params }: SettingsMenuPageProps) {
	const { id: koudenId } = await params;

	return <SettingsMenu koudenId={koudenId} />;
}
