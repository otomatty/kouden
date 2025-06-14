import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Crown, Activity } from "lucide-react";

export function UserManagementSkeleton() {
	// スケルトンローディング用の固定キー
	const skeletonKeys = useMemo(
		() => Array.from({ length: 5 }, (_, i) => `skeleton-${Date.now()}-${i}`),
		[],
	);

	return (
		<div className="space-y-6">
			{/* 検索・フィルター */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						検索・フィルター
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="flex gap-2">
								<div className="h-10 bg-gray-200 rounded-md flex-1 animate-pulse" />
								<div className="h-10 w-16 bg-gray-200 rounded-md animate-pulse" />
							</div>
						</div>

						<div className="flex gap-2">
							<div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
							<div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 統計情報 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-sm text-muted-foreground">総ユーザー数</p>
								<div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Crown className="h-5 w-5 text-yellow-600" />
							<div>
								<p className="text-sm text-muted-foreground">管理者数</p>
								<div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">アクティブユーザー</p>
								<div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* ユーザー一覧 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>ユーザー一覧</span>
						<div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{skeletonKeys.map((key) => (
							<div
								key={key}
								className="flex items-center gap-4 p-4 border rounded-lg animate-pulse"
							>
								<div className="w-12 h-12 bg-gray-200 rounded-full" />
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-gray-200 rounded w-1/4" />
									<div className="h-3 bg-gray-200 rounded w-1/2" />
								</div>
								<div className="space-y-1">
									<div className="h-3 bg-gray-200 rounded w-16" />
									<div className="h-3 bg-gray-200 rounded w-12" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
