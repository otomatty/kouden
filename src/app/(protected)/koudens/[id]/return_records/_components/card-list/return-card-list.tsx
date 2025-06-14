"use client";

// library
import { useMemo } from "react";
// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { Relationship } from "@/types/relationships";
// components
import { ReturnCard } from "./return-card";
import { StickySearchHeader } from "./sticky-search-header";
import { Loader2 } from "lucide-react";

// Props
interface ReturnCardListProps {
	returns: ReturnManagementSummary[];
	koudenId: string;
	relationships: Relationship[];
	searchValue: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	hasMore: boolean;
	isLoading: boolean;
	lastElementRef: (node: HTMLElement | null) => void;
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
}

/**
 * ReturnCardListコンポーネント
 * 役割：返礼管理のカードリスト表示（モバイル用）
 */
export function ReturnCardList({
	returns,
	relationships,
	searchValue,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	hasMore,
	isLoading,
	lastElementRef,
	onEditReturn,
}: ReturnCardListProps) {
	// Sort returns by creation date (newest first)
	const sortedReturns = useMemo(() => {
		return [...returns].sort(
			(a, b) =>
				new Date(b.returnRecordCreated).getTime() - new Date(a.returnRecordCreated).getTime(),
		);
	}, [returns]);

	return (
		<div className="flex flex-col h-full">
			{/* 検索・フィルターヘッダー */}
			<StickySearchHeader
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				statusFilter={statusFilter}
				onStatusFilterChange={onStatusFilterChange}
				onAddReturn={() => {
					// 新規返礼追加ダイアログを開く（TODO: 実装）
					console.log("新規返礼追加");
				}}
			/>

			{/* カードリスト */}
			<div className="flex-1 overflow-y-auto">
				<div className="space-y-4 p-4">
					{sortedReturns.length === 0 && !isLoading ? (
						<div className="text-center text-muted-foreground py-8">返礼記録が見つかりません</div>
					) : (
						<>
							{sortedReturns.map((returnRecord, index) => {
								// 最後の要素にrefを設定
								const isLast = index === sortedReturns.length - 1;
								return (
									<div key={returnRecord.koudenEntryId} ref={isLast ? lastElementRef : null}>
										<ReturnCard
											returnRecord={returnRecord}
											relationships={relationships}
											onEditReturn={onEditReturn}
										/>
									</div>
								);
							})}

							{/* ローディングインジケーター */}
							{isLoading && (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin mr-2" />
									<span className="text-muted-foreground">読み込み中...</span>
								</div>
							)}

							{/* 終了メッセージ */}
							{!hasMore && sortedReturns.length > 0 && (
								<div className="text-center text-muted-foreground py-4 text-sm">
									全ての返礼記録を表示しました
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
