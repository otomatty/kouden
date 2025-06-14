import { TableSkeleton } from "@/components/custom/loading/skeletons";

/**
 * 返礼品管理ページのローディング表示
 */
export default function ReturnItemsLoading() {
	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				{/* ヘッダースケルトン */}
				<div className="space-y-2">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-5 w-96 bg-muted animate-pulse rounded" />
				</div>

				{/* テーブルスケルトン */}
				<TableSkeleton />
			</div>
		</div>
	);
}
