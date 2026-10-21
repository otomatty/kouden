import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GeneralSettingsLoading() {
	return (
		<div className="max-w-2xl mx-auto">
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-48" />
				</CardHeader>
				<CardContent className="space-y-6">
					{/* フォームフィールドのスケルトン */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-24 w-full" />
					</div>
					{/* 保存ボタンのスケルトン */}
					<div className="pt-4">
						<Skeleton className="h-10 w-24" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
