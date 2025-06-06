import { FormSkeleton } from "@/components/custom/loading/skeletons";

/**
 * 設定のローディング状態を表示するコンポーネント
 * - フォームのスケルトンを表示
 */
export default function SettingsLoading() {
	return <FormSkeleton fields={3} />;
}
