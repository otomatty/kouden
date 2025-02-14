import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonProps {
	/**
	 * スケルトンの行数
	 * @default 5
	 */
	rows?: number;
	/**
	 * テーブルの列定義
	 */
	columns?: readonly string[];
}

interface ResponsiveSkeletonProps extends SkeletonProps {
	/**
	 * 検索バーを表示するかどうか
	 * @default true
	 */
	showSearchBar?: boolean;

	/**
	 * モバイル表示時のスタイル
	 * @default "card-list"
	 */
	mobileStyle?: "card-list" | "grid";

	/**
	 * グリッド表示時の列数
	 * @default { sm: 2, lg: 3 }
	 */
	gridColumns?: {
		sm?: number;
		lg?: number;
	};
}

interface FormSkeletonProps {
	/**
	 * フォームフィールドの数
	 * @default 3
	 */
	fields?: number;
}

interface StatsSummaryCardProps {
	/**
	 * カードの数
	 * @default 3
	 */
	cards?: number;
}

interface GridCardSkeletonProps {
	/**
	 * カードの数
	 * @default 6
	 */
	cards?: number;
	/**
	 * グリッドの列数
	 * @default { sm: 2, lg: 3 }
	 */
	columns?: {
		sm?: number;
		lg?: number;
	};
}

/**
 * レスポンシブなスケルトンコンポーネント
 * - デスクトップ：テーブル形式
 * - モバイル：カードリスト形式またはグリッド形式
 */
export function ResponsiveSkeleton({
	rows = 5,
	columns = [],
	showSearchBar = true,
	mobileStyle = "card-list",
	gridColumns = { sm: 2, lg: 3 },
}: ResponsiveSkeletonProps) {
	return (
		<div className="space-y-4 mt-4">
			{/* 検索バーのスケルトン */}
			{showSearchBar && (
				<div className="flex items-center justify-between gap-4">
					<div className="border rounded-md p-4 flex-1">
						<Skeleton className="h-8 " />
					</div>
					<div className="border rounded-md p-4 w-[300px]">
						<Skeleton className="h-8 " />
					</div>
					<div className="border rounded-md p-4 w-[150px]">
						<Skeleton className="h-8 " />
					</div>
				</div>
			)}

			{/* デスクトップ表示（md以上） */}
			<div className="hidden md:block">
				<TableSkeleton rows={rows} columns={columns} />
			</div>

			{/* モバイル表示（md未満） */}
			<div className="md:hidden">
				{mobileStyle === "grid" ? (
					<GridCardSkeleton cards={rows} columns={gridColumns} />
				) : (
					<CardListSkeleton rows={rows} />
				)}
			</div>
		</div>
	);
}

/**
 * テーブル形式のスケルトン
 */
export function TableSkeleton({ rows = 5, columns = [] }: SkeletonProps) {
	const rowIds = Array.from({ length: rows }, (_, i) => i.toString());
	const columnIds =
		columns.length > 0 ? columns : Array.from({ length: 5 }, (_, i) => i.toString());

	return (
		<div className="rounded-md border">
			{/* ヘッダー */}
			<div className="border-b bg-muted/50 p-4">
				<div className="flex items-center gap-4">
					{columnIds.map((col) => (
						<Skeleton key={`header-${col}`} className="h-4 flex-1" />
					))}
				</div>
			</div>
			{/* ボディ */}
			<div className="divide-y">
				{rowIds.map((row) => (
					<div key={`row-${row}`} className="p-4">
						<div className="flex items-center gap-4">
							{columnIds.map((col) => (
								<Skeleton key={`cell-${row}-${col}`} className="h-4 flex-1" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * カードリスト形式のスケルトン
 */
export function CardListSkeleton({ rows = 5 }: SkeletonProps) {
	const rowIds = Array.from({ length: rows }, (_, i) => i.toString());

	return (
		<div className="space-y-4 mt-4">
			{rowIds.map((row) => (
				<div key={`card-${row}`} className="rounded-lg border p-4 space-y-4">
					{/* カードヘッダー */}
					<div className="flex items-center justify-between">
						<Skeleton className="h-6 w-full" />
					</div>
					{/* カードボディ */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[150px]" />
						<Skeleton className="h-4 w-[180px]" />
					</div>
					{/* カードフッター */}
					<div className="flex items-center justify-between pt-2">
						<Skeleton className="h-4 w-[120px]" />
						<Skeleton className="h-8 w-[80px]" />
					</div>
				</div>
			))}
		</div>
	);
}

/**
 * カード形式のスケルトン
 * - ヘッダーとコンテンツを持つカードのスケルトン
 */
export function CardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-8 w-48" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Skeleton className="h-24 w-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-2/3" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * フォーム形式のスケルトン
 */
export function FormSkeleton({ fields = 3 }: FormSkeletonProps) {
	const fieldIds = Array.from({ length: fields }, (_, i) => i.toString());

	return (
		<div className="space-y-6">
			{/* セクションタイトルのスケルトン */}
			<Skeleton className="h-6 w-[200px]" />

			{/* フォームのスケルトン */}
			<div className="space-y-8">
				{fieldIds.map((field) => (
					<div key={`field-${field}`} className="space-y-4">
						<Skeleton className="h-5 w-[150px]" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-4 w-[200px]" />
					</div>
				))}

				{/* ボタングループのスケルトン */}
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-[100px]" />
					<Skeleton className="h-10 w-[100px]" />
				</div>
			</div>
		</div>
	);
}

/**
 * 統計サマリーカードのスケルトン
 */
export function StatsSummarySkeleton({ cards = 3 }: StatsSummaryCardProps) {
	const cardIds = Array.from({ length: cards }, (_, i) => i.toString());

	return (
		<div className="space-y-8 mt-4">
			{/* サマリーカードのスケルトン */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{cardIds.map((card) => (
					<div key={`summary-${card}`} className="rounded-lg border p-8">
						<div className="space-y-3">
							<Skeleton className="h-4 w-[100px]" />
							<Skeleton className="h-8 w-[150px]" />
						</div>
					</div>
				))}
			</div>

			{/* グラフのスケルトン */}
			<div className="space-y-4">
				<div className="rounded-lg border p-4">
					<div className="space-y-4">
						<Skeleton className="h-6 w-[200px]" />
						<Skeleton className="h-[300px] w-full" />
					</div>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{["daily", "monthly"].map((chart) => (
						<div key={`chart-${chart}`} className="rounded-lg border p-4">
							<div className="space-y-4">
								<Skeleton className="h-6 w-[150px]" />
								<Skeleton className="h-[200px] w-full" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * グリッドカード形式のスケルトン
 */
export function GridCardSkeleton({ cards = 6, columns = { sm: 2, lg: 3 } }: GridCardSkeletonProps) {
	const cardIds = Array.from({ length: cards }, (_, i) => i.toString());

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

			{/* カードグリッドのスケルトン */}
			<div className={`grid gap-4 sm:grid-cols-${columns.sm} lg:grid-cols-${columns.lg}`}>
				{cardIds.map((card) => (
					<div key={`card-${card}`} className="rounded-lg border p-4">
						<div className="space-y-3">
							<Skeleton className="h-4 w-[200px]" />
							<Skeleton className="h-4 w-[150px]" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-[80%]" />
							</div>
							<div className="flex justify-end">
								<Skeleton className="h-8 w-[100px]" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
