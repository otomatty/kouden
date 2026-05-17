import { getReturnItem } from "@/app/_actions/return-records/return-items";
import { notFound } from "next/navigation";
import { ReturnItemDetailPageClient } from "./return-item-detail-page-client";

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
		const result = await getReturnItem(itemId);

		if (!result.ok) {
			if (result.error.code === "NOT_FOUND") {
				notFound();
			}
			throw new Error(result.error.message);
		}

		const returnItem = result.data;

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
