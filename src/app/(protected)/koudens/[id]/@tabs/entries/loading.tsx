import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = ["name", "relationship", "amount", "note", "created_at"] as const;
const ROWS = ["a", "b", "c", "d", "e"] as const;

/**
 * 記帳一覧のローディング状態を表示するコンポーネント
 * - テーブルのスケルトンを表示
 */
export default function EntriesLoading() {
	return (
		<div className="space-y-4">
			{/* 検索バーのスケルトン */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-[250px]" />
				<Skeleton className="h-10 w-[100px]" />
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
