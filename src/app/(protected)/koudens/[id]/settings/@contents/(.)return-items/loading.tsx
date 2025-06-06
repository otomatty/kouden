import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ReturnItemsLoading() {
	return (
		<div className="space-y-6">
			{/* ヘッダー部分 */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* フィルター部分 */}
			<div className="flex gap-4 items-center">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-10 w-48" />
			</div>

			{/* 返礼品リスト */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="space-y-4">
								{/* 商品画像 */}
								<Skeleton className="h-48 w-full rounded-lg" />
								{/* 商品情報 */}
								<div className="space-y-2">
									<Skeleton className="h-6 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
									<div className="flex justify-between items-center pt-2">
										<Skeleton className="h-6 w-24" />
										<div className="flex gap-2">
											<Skeleton className="h-8 w-8" />
											<Skeleton className="h-8 w-8" />
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
