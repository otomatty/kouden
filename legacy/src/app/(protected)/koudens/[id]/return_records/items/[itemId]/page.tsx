import { getReturnItem } from "@/app/_actions/return-records/return-items";
import { KoudenError } from "@/lib/errors";
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

	// 返礼品詳細データを取得。`NOT_FOUND` のみ 404、
	// 権限エラーや DB 障害はそのまま伝播させて error boundary に任せる。
	const result = await getReturnItem(itemId);

	if (!result.ok) {
		if (result.error.code === "NOT_FOUND") {
			notFound();
		}
		// `ActionResult.error` は plain object のため、Error 派生として
		// 再構築する。`code` / `status` を保持しておくと、上位の error.tsx
		// から分類ロジックや構造化ログが組めるようになる。
		throw new KoudenError(result.error.message, result.error.code, {
			status: result.error.status,
		});
	}

	const returnItem = result.data;

	// 香典帳IDが一致しない場合は404
	if (returnItem.kouden_id !== koudenId) {
		notFound();
	}

	return <ReturnItemDetailPageClient returnItem={returnItem} koudenId={koudenId} />;
}
