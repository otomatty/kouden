import { ResponsiveSkeleton } from "@/components/custom/loading/skeletons";

const COLUMNS = [
	"select",
	"entryName",
	"organization",
	"relationshipName",
	"koudenAmount",
	"totalAmount",
	"returnStatus",
	"arrangementDate",
	"returnRecordCreated",
	"actions",
] as const;

/**
 * 返礼品管理画面のローディング状態
 * - デスクトップ：テーブルのスケルトンを表示
 * - モバイル：カードリストのスケルトンを表示
 */
export default function ReturnRecordsLoading() {
	return <ResponsiveSkeleton columns={COLUMNS} rows={5} />;
}
