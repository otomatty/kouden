import { Suspense } from "react";
import { TelegramsView } from "./_components";
import type { Telegram } from "@/types/telegrams";
import type { Entry } from "@/types/entries";

// actions
import { getTelegrams } from "@/app/_actions/telegrams";
import { getEntries } from "@/app/_actions/entries";

interface TelegramsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 弔電（telegrams）のページコンポーネント
 * - 弔電情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 */
export default async function TelegramsPage({ params }: TelegramsPageProps) {
	const { id: koudenId } = await params;
	// TODO: データの取得処理を実装
	const [telegrams, entries] = await Promise.all([getTelegrams(koudenId), getEntries(koudenId)]);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<TelegramsView koudenId={koudenId} telegrams={telegrams} entries={entries} />
		</Suspense>
	);
}
