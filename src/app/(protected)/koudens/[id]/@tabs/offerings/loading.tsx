import { ResponsiveSkeleton } from "@/components/custom/loading/skeletons";

const COLUMNS = ["name", "relationship", "amount", "note", "payment", "created_at"] as const;

/**
 * お供物一覧のローディング状態を表示するコンポーネント
 * - デスクトップ：テーブルのスケルトンを表示
 * - モバイル：カードリストのスケルトンを表示
 */
export default function OfferingsLoading() {
	return <ResponsiveSkeleton columns={COLUMNS} rows={5} />;
}
