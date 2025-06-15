import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { TelegramsView } from "@/app/(protected)/koudens/[id]/telegrams/_components";
import { getTelegrams } from "@/app/_actions/telegrams";
import { getEntriesForAdmin } from "@/app/_actions/entries";

interface AdminTelegramsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 管理者用弔電（telegrams）のページコンポーネント
 * - 弔電情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 * - 管理者権限でアクセス
 */
export default async function AdminTelegramsPage({ params }: AdminTelegramsPageProps) {
	const { id: koudenId } = await params;

	// 管理者権限チェック
	await checkAdminPermission();

	// 弔電情報とエントリー情報を取得
	const [telegrams, { entries }] = await Promise.all([
		getTelegrams(koudenId),
		getEntriesForAdmin(koudenId),
	]);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<TelegramsView koudenId={koudenId} telegrams={telegrams} entries={entries} />
		</div>
	);
}
