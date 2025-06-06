import { ResponsiveSkeleton } from "@/components/custom/loading/skeletons";

const COLUMNS = ["name", "relationship", "amount", "note", "created_at"] as const;

/**
 * 記帳一覧のローディング状態を表示するコンポーネント
 * - デスクトップ：テーブルのスケルトンを表示
 * - モバイル：カードリストのスケルトンを表示
 */
export default function EntriesLoading() {
	return (
		<ResponsiveSkeleton columns={COLUMNS} rows={5} showSearchBar={false} mobileStyle="card-list" />
	);
}
