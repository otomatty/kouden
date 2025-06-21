import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PopularPosts } from "@/components/blog/popular-posts";
import { Eye, Bookmark, Calendar } from "lucide-react";
import type { TPost } from "@/types/post";

interface BlogSidebarProps {
	recentPosts?: TPost[];
}

/**
 * ブログサイドバーコンポーネント
 * 人気記事、最新記事、カテゴリ一覧を表示
 */
export function BlogSidebar({ recentPosts = [] }: BlogSidebarProps) {
	return (
		<aside className="space-y-6">
			{/* 人気記事 - 統計情報付き */}
			<PopularPosts limit={5} showTabs={false} defaultPeriod="week" className="w-full" />

			{/* 最新記事 */}
			{recentPosts.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">最新記事</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{recentPosts.slice(0, 5).map((post) => (
							<Link
								key={post.id}
								href={`/blog/${post.slug}`}
								className="block hover:bg-muted/50 p-3 rounded-lg transition-colors"
							>
								<h3 className="font-medium line-clamp-2 text-sm mb-2 leading-tight">
									{post.title}
								</h3>

								{post.excerpt && (
									<p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
								)}

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{post.category && (
											<Badge variant="outline" className="text-xs px-2 py-0.5">
												{post.category}
											</Badge>
										)}
										{post.published_at && (
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
												<Calendar className="h-3 w-3" />
												<span>
													{new Date(post.published_at).toLocaleDateString("ja-JP", {
														month: "short",
														day: "numeric",
													})}
												</span>
											</div>
										)}
									</div>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>
			)}

			{/* カテゴリ一覧 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">カテゴリ</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Link
							href="/blog?category=manners"
							className="block text-sm hover:text-primary transition-colors py-1"
						>
							香典のマナー
						</Link>
						<Link
							href="/blog?category=funeral"
							className="block text-sm hover:text-primary transition-colors py-1"
						>
							葬儀の準備
						</Link>
						<Link
							href="/blog?category=ceremony"
							className="block text-sm hover:text-primary transition-colors py-1"
						>
							法要について
						</Link>
						<Link
							href="/blog?category=app"
							className="block text-sm hover:text-primary transition-colors py-1"
						>
							アプリの使い方
						</Link>
					</div>
				</CardContent>
			</Card>
		</aside>
	);
}
