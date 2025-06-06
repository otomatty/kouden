import { TelegramsView } from "./_components";
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
	const [telegrams, entriesResult] = await Promise.all([
		getTelegrams(koudenId),
		getEntries(koudenId),
	]);
	const entries = entriesResult.entries;

	return (
		<div className="mt-4">
			<TelegramsView koudenId={koudenId} telegrams={telegrams} entries={entries} />
		</div>
	);
}
