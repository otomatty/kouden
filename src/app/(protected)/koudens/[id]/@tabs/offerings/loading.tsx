import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = ["name", "relationship", "amount", "note", "payment", "created_at"] as const;
const ROWS = ["a", "b", "c", "d", "e"] as const;

/**
 * 香典一覧のローディング状態を表示するコンポーネント
 * - テーブルのスケルトンを表示
 */
export default function OfferingsLoading() {
	return (
		<div className="space-y-4">
			{/* フィルターとアクションのスケルトン */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Skeleton className="h-10 w-[150px]" />
					<Skeleton className="h-10 w-[150px]" />
				</div>
				<Skeleton className="h-10 w-[120px]" />
			</div>

			{/* テーブルのスケルトン */}
			<div className="rounded-md border">
				<div className="border-b bg-muted/50 p-4">
					<div className="flex items-center gap-4">
						{COLUMNS.map((col) => (
							<Skeleton key={`header-${col}`} className="h-4 w-[100px]" />
						))}
					</div>
				</div>
				<div className="divide-y">
					{ROWS.map((row) => (
						<div key={`row-${row}`} className="p-4">
							<div className="flex items-center gap-4">
								{COLUMNS.map((col) => (
									<Skeleton key={`cell-${row}-${col}`} className="h-4 w-[100px]" />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
