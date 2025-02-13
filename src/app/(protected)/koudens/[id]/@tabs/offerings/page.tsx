import { OfferingView } from "./_components";
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
	const [offerings, entries] = await Promise.all([getOfferings(koudenId), getEntries(koudenId)]);

	return (
		<div className="mt-4">
			<OfferingView koudenId={koudenId} offerings={offerings} entries={entries} />
		</div>
	);
}
