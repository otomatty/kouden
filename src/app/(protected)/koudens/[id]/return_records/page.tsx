import { notFound } from "next/navigation";
import { getReturnEntriesByKoudenPaginated } from "@/app/_actions/return-records/return-records";
import { getKouden } from "@/app/_actions/koudens";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";
import { getReturnItems } from "@/app/_actions/return-records/return-items";
import { convertToReturnManagementSummaries } from "@/utils/return-records-helpers";
import ReturnRecordsPageClient from "./ReturnRecordsPageClient";
import type {
	ReturnManagementSummary,
	ReturnItem,
	ReturnStatus,
} from "@/types/return-records/return-records";

interface ReturnRecordsPageProps {
	params: Promise<{
		id: string;
	}>;
	searchParams: Promise<{
		search?: string;
		status?: string;
	}>;
}

/**
 * 返礼管理ページ
 * 役割：香典帳に紐づく返礼情報の管理画面（無限スクロール対応）
 */
export default async function ReturnRecordsPage({ params, searchParams }: ReturnRecordsPageProps) {
	const { id: koudenId } = await params;
	const resolvedSearchParams = await searchParams;

	// 初期フィルター設定
	const initialFilters = {
		search: resolvedSearchParams.search,
		status: resolvedSearchParams.status !== "all" ? resolvedSearchParams.status : undefined,
	};

	try {
		// 並行データ取得
		const [koudenDetails, entriesResult, relationships, initialReturns, returnItems] =
			await Promise.all([
				getKouden(koudenId),
				getEntries(koudenId),
				getRelationships(koudenId),
				getReturnEntriesByKoudenPaginated(koudenId, 100, undefined, initialFilters),
				getReturnItems(koudenId),
			]);

		if (!koudenDetails) {
			notFound();
		}

		const entries = entriesResult;

		// 返礼管理サマリーの型に変換（実際のお供物配分金額を取得）
		const returnSummaries = await convertToReturnManagementSummaries(
			initialReturns.data,
			entries.entries,
			relationships,
			koudenId,
		);

		return (
			<div className="mt-4">
				<ReturnRecordsPageClient
					koudenId={koudenId}
					initialReturns={returnSummaries}
					entries={entries.entries}
					relationships={relationships || []}
					initialHasMore={initialReturns.hasMore}
					initialCursor={initialReturns.nextCursor}
					returnItems={returnItems}
				/>
			</div>
		);
	} catch (error) {
		console.error("返礼管理ページの初期化エラー:", error);
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
