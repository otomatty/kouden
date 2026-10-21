import { getEntriesForSelector } from "@/app/_actions/entries";
import { getOfferings } from "@/app/_actions/offerings";
import { OfferingView } from "./_components";

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

	try {
		const [offeringsResult, entriesResult] = await Promise.all([
			getOfferings(koudenId),
			getEntriesForSelector(koudenId),
		]);
		if (!offeringsResult.ok) {
			throw new Error(offeringsResult.error.message);
		}
		if (!entriesResult.ok) {
			throw new Error(entriesResult.error.message);
		}
		const offerings = offeringsResult.data;
		const entries = entriesResult.data;

		return (
			<div className="mt-4">
				<OfferingView koudenId={koudenId} offerings={offerings} entries={entries} />
			</div>
		);
	} catch (error) {
		console.error("お供物ページの初期化エラー:", error);
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center justify-center py-8">
					<p className="text-destructive mb-4">データの読み込みに失敗しました</p>
					<p className="text-sm text-muted-foreground">ページを再読み込みしてください</p>
				</div>
			</div>
		);
	}
}
