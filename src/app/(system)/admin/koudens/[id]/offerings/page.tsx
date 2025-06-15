import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { OfferingView } from "@/app/(protected)/koudens/[id]/offerings/_components";
import { getOfferings } from "@/app/_actions/offerings";
import { getEntriesForAdmin } from "@/app/_actions/entries";

interface AdminOfferingsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 管理者用お供物（offerings）のページコンポーネント
 * - お供物情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 * - 管理者権限でアクセス
 */
export default async function AdminOfferingsPage({ params }: AdminOfferingsPageProps) {
	const { id: koudenId } = await params;

	// 管理者権限チェック
	await checkAdminPermission();

	// 供物情報とエントリー情報を取得
	const [offerings, { entries }] = await Promise.all([
		getOfferings(koudenId),
		getEntriesForAdmin(koudenId, 1, Number.MAX_SAFE_INTEGER),
	]);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<OfferingView koudenId={koudenId} offerings={offerings} entries={entries} />
		</div>
	);
}
