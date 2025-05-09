import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DeliveryMethodsLoading() {
	return (
		<div className="space-y-6">
			{/* ヘッダー部分 */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* 配送方法リスト */}
			<div className="grid gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-4 w-48" />
								</div>
								<div className="flex gap-2">
									<Skeleton className="h-9 w-9" />
									<Skeleton className="h-9 w-9" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
