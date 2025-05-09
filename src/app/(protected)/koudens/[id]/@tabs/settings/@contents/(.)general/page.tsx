import { getKouden } from "@/app/_actions/koudens";
import { GeneralSettingsForm } from "./_components/general-settings-form";
import { SettingsHeader } from "../../_components/settings-header";

interface GeneralSettingsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 一般設定ページ
 * - 香典帳の基本情報を表示・編集
 * - データ取得とコンポーネントへの受け渡しを担当
 */
export default async function GeneralSettingsPage({ params }: GeneralSettingsPageProps) {
	const { id: koudenId } = await params;
	const kouden = await getKouden(koudenId);

	return (
		<div className="space-y-6">
			<SettingsHeader title="一般設定" description="香典帳の基本的な設定を管理します" />
			<GeneralSettingsForm
				koudenId={koudenId}
				defaultValues={{
					title: kouden.title,
					description: kouden.description ?? "",
				}}
			/>
		</div>
	);
}
