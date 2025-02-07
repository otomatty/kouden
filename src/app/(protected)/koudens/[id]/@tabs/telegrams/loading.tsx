import { Skeleton } from "@/components/ui/skeleton";

const CARDS = ["a", "b", "c", "d", "e", "f"] as const;

/**
 * 電報一覧のローディング状態を表示するコンポーネント
 * - カードリストのスケルトンを表示
 */
export default function TelegramsLoading() {
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

			{/* カードリストのスケルトン */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{CARDS.map((card) => (
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
