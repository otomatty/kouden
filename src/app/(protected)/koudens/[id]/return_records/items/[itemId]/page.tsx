import { notFound } from "next/navigation";
import { getReturnItem } from "@/app/_actions/return-records/return-items";
import { ReturnItemDetailPageClient } from "./ReturnItemDetailPageClient";

interface ReturnItemDetailPageProps {
	params: Promise<{
		id: string;
		itemId: string;
	}>;
}

/**
 * 返礼品詳細ページ
 * Server Component として実装し、初期データをフェッチしてクライアントコンポーネントに渡す
 */
export default async function ReturnItemDetailPage({ params }: ReturnItemDetailPageProps) {
	const { id: koudenId, itemId } = await params;

	try {
		// 返礼品詳細データを取得
		const returnItem = await getReturnItem(itemId);

		if (!returnItem) {
			notFound();
		}

		// 香典帳IDが一致しない場合は404
		if (returnItem.kouden_id !== koudenId) {
			notFound();
		}

		return <ReturnItemDetailPageClient returnItem={returnItem} koudenId={koudenId} />;
	} catch (error) {
		console.error("[ERROR] Failed to fetch return item details:", error);
		notFound();
	}
}
