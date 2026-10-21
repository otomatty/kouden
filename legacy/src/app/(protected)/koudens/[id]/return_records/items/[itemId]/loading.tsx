import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 返礼品詳細ページのローディング画面
 */
export default function Loading() {
	return (
		<div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
			{/* ヘッダースケルトン */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-24" />
					<div className="h-6 w-px bg-border" />
					<Skeleton className="h-8 w-32" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-9 w-16" />
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-16" />
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				{/* メイン情報スケルトン */}
				<div className="lg:col-span-2 space-y-6">
					{/* 基本情報カード */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="space-y-2">
									<Skeleton className="h-7 w-64" />
									<Skeleton className="h-5 w-20" />
								</div>
								<div className="text-right space-y-1">
									<Skeleton className="h-8 w-24" />
									<Skeleton className="h-4 w-16" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* 画像スケルトン */}
							<Skeleton className="aspect-video w-full rounded-lg" />

							{/* 説明文スケルトン */}
							<div className="space-y-2">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</CardContent>
					</Card>

					{/* 推奨金額カード */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent className="space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-64" />
						</CardContent>
					</Card>
				</div>

				{/* サイドバースケルトン */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-24" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-8" />
								</div>
								<Skeleton className="h-px w-full" />
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4" />
										<Skeleton className="h-4 w-16" />
									</div>
									<Skeleton className="h-4 w-32 ml-6" />
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4" />
										<Skeleton className="h-4 w-16" />
									</div>
									<Skeleton className="h-4 w-32 ml-6" />
								</div>
								<Skeleton className="h-px w-full" />
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4" />
										<Skeleton className="h-4 w-20" />
									</div>
									<Skeleton className="h-3 w-full ml-6" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
