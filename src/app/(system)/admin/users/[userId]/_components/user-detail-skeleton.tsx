import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, BookOpen, FileText } from "lucide-react";

export function UserDetailSkeleton() {
	// スケルトンローディング用の固定キー
	const infoKeys = useMemo(
		() => Array.from({ length: 4 }, (_, i) => `info-skeleton-${Date.now()}-${i}`),
		[],
	);

	const tabKeys = useMemo(
		() => Array.from({ length: 3 }, (_, i) => `tab-skeleton-${Date.now()}-${i}`),
		[],
	);

	const contentKeys = useMemo(
		() => Array.from({ length: 3 }, (_, i) => `content-skeleton-${Date.now()}-${i}`),
		[],
	);

	const statsKeys = useMemo(
		() => Array.from({ length: 3 }, (_, i) => `stats-skeleton-${Date.now()}-${i}`),
		[],
	);

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center gap-4">
				<div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
				<div>
					<div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
					<div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
				</div>
			</div>

			{/* ユーザー基本情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						基本情報
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-start gap-6">
						<div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />

						<div className="flex-1 space-y-4">
							<div>
								<div className="flex items-center gap-2 mb-2">
									<div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
									<div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{infoKeys.map((key) => (
										<div key={key} className="flex items-center gap-2">
											<div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
											<div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 統計情報 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[BookOpen, Users, FileText].map((Icon, i) => (
					<Card key={statsKeys[i]}>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<Icon className="h-5 w-5 text-muted-foreground" />
								<div>
									<div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
									<div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* タブナビゲーション */}
			<Card>
				<CardHeader>
					<div className="flex space-x-1 border-b">
						{tabKeys.map((key) => (
							<div key={key} className="h-10 w-24 bg-gray-200 rounded-t-lg animate-pulse" />
						))}
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{contentKeys.map((key) => (
							<div key={key} className="p-4 border rounded-lg">
								<div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
								<div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
