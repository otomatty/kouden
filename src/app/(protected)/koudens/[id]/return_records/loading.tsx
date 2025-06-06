import { CardSkeleton } from "@/components/custom/loading/skeletons";

/**
 * 返礼品管理画面のローディング状態
 * - カードのスケルトンを表示
 */
export default function ReturnRecordsLoading() {
	return (
		<div className="container mx-auto p-4 space-y-6">
			<CardSkeleton />
		</div>
	);
}
