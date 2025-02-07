import { Suspense } from "react";
import { OfferingView } from "./_components";
import type { Offering } from "@/types/offerings";
import type { Entry } from "@/types/entries";

// actions
import { getOfferings } from "@/app/_actions/offerings";
import { getEntries } from "@/app/_actions/entries";

interface OfferingsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * お供物（offerings）のページコンポーネント
 * - お供物情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 */
export default async function OfferingsPage({ params }: OfferingsPageProps) {
	const { id: koudenId } = await params;
	// TODO: データの取得処理を実装
	const [offerings, entries] = await Promise.all([getOfferings(koudenId), getEntries(koudenId)]);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<OfferingView koudenId={koudenId} offerings={offerings} entries={entries} />
		</Suspense>
	);
}
