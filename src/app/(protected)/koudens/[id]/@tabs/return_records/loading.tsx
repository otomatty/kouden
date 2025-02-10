import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 返礼品管理画面のローディング状態
 * - カードのスケルトンを表示
 */
export default function ReturnRecordsLoading() {
	return (
		<div className="container mx-auto p-4 space-y-6">
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
		</div>
	);
}
