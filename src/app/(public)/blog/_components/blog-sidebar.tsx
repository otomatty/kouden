import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TPost } from "@/types/post";

interface BlogSidebarProps {
	popularPosts?: TPost[];
	recentPosts?: TPost[];
}

/**
 * ブログサイドバーコンポーネント
 */
export function BlogSidebar({ popularPosts = [], recentPosts = [] }: BlogSidebarProps) {
	return (
		<aside className="space-y-6">
			{/* 人気記事 */}
			{popularPosts.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">人気記事</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{popularPosts.slice(0, 5).map((post, index) => (
							<Link
								key={post.id}
								href={`/blog/${post.slug}`}
								className="block hover:bg-muted/50 p-2 rounded transition-colors"
							>
								<div className="flex items-start gap-3">
									<span className="text-lg font-bold text-primary mt-1 min-w-[24px]">
										{index + 1}
									</span>
									<div className="flex-1 min-w-0">
										<h3 className="font-medium line-clamp-2 text-sm mb-1">{post.title}</h3>
										<p className="text-xs text-muted-foreground">
											{post.published_at && new Date(post.published_at).toLocaleDateString("ja-JP")}
										</p>
									</div>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>
			)}

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
								className="block hover:bg-muted/50 p-2 rounded transition-colors"
							>
								<h3 className="font-medium line-clamp-2 text-sm mb-2">{post.title}</h3>
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										{post.published_at && new Date(post.published_at).toLocaleDateString("ja-JP")}
									</span>
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
							className="block text-sm hover:text-primary transition-colors"
						>
							香典のマナー
						</Link>
						<Link
							href="/blog?category=funeral"
							className="block text-sm hover:text-primary transition-colors"
						>
							葬儀の準備
						</Link>
						<Link
							href="/blog?category=ceremony"
							className="block text-sm hover:text-primary transition-colors"
						>
							法要について
						</Link>
						<Link
							href="/blog?category=app"
							className="block text-sm hover:text-primary transition-colors"
						>
							アプリの使い方
						</Link>
					</div>
				</CardContent>
			</Card>
		</aside>
	);
}
