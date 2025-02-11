import { ResponsiveSkeleton } from "@/components/custom/loading/skeletons";

const COLUMNS = ["sender", "message", "created_at", "status"] as const;

/**
 * 弔電一覧のローディング状態を表示するコンポーネント
 * - デスクトップ：テーブルのスケルトンを表示
 * - モバイル：カードグリッドのスケルトンを表示
 */
export default function TelegramsLoading() {
	return (
		<ResponsiveSkeleton
			columns={COLUMNS}
			rows={6}
			mobileStyle="grid"
			gridColumns={{ sm: 2, lg: 3 }}
		/>
	);
}
