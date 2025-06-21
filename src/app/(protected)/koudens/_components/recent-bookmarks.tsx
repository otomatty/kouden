"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, Eye, ArrowRight, BookOpen } from "lucide-react";
import { getUserBookmarks } from "@/app/_actions/blog/bookmarks";
import type { BookmarkInfo } from "@/types/blog";

interface RecentBookmarksProps {
	className?: string;
	limit?: number;
}

/**
 * 香典帳一覧ページ用の最近のブックマーク表示コンポーネント
 * ユーザーが最近ブックマークした記事を5件まで表示
 *
 * @param className - 追加のCSSクラス
 * @param limit - 表示する記事数（デフォルト: 5）
 */
export function RecentBookmarks({ className = "", limit = 5 }: RecentBookmarksProps) {
	const [bookmarks, setBookmarks] = useState<BookmarkInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchBookmarks = async () => {
			try {
				setLoading(true);
				setError(null);
				const { data, error: fetchError } = await getUserBookmarks();

				if (fetchError) {
					throw new Error(fetchError);
				}

				// 型安全な変換とリミット適用
				const transformedData = (data || [])
					.map((bookmark) => ({
						id: bookmark.id,
						created_at: bookmark.created_at,
						post: {
							id: bookmark.post.id,
							title: bookmark.post.title,
							slug: bookmark.post.slug,
							excerpt: bookmark.post.excerpt || undefined,
							category: bookmark.post.category || undefined,
							published_at: bookmark.post.published_at || "",
							post_stats: bookmark.post.post_stats
								? {
										view_count: bookmark.post.post_stats.view_count || 0,
										bookmark_count: bookmark.post.post_stats.bookmark_count || 0,
									}
								: undefined,
						},
					}))
					.slice(0, limit) as BookmarkInfo[];

				setBookmarks(transformedData);
			} catch (err) {
				console.error("Failed to fetch bookmarks:", err);
				setError("ブックマークの取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchBookmarks();
	}, [limit]);

	const renderBookmarkItem = (bookmark: BookmarkInfo) => (
		<Link
			key={bookmark.id}
			href={`/blog/${bookmark.post.slug}`}
			className="block group p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-200"
		>
			<div className="flex items-start justify-between">
				<div className="flex-1 min-w-0">
					<h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
						{bookmark.post.title}
					</h4>

					{bookmark.post.excerpt && (
						<p className="text-xs text-muted-foreground line-clamp-1 mb-2">
							{bookmark.post.excerpt}
						</p>
					)}

					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						{bookmark.post.category && (
							<Badge variant="outline" className="text-xs px-1.5 py-0.5">
								{bookmark.post.category}
							</Badge>
						)}

						{bookmark.post.post_stats && (
							<div className="flex items-center gap-1">
								<Eye className="h-3 w-3" />
								<span>{bookmark.post.post_stats.view_count.toLocaleString()}</span>
							</div>
						)}

						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>
								{new Date(bookmark.created_at).toLocaleDateString("ja-JP", {
									month: "short",
									day: "numeric",
								})}
							</span>
						</div>
					</div>
				</div>

				<ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 ml-2 flex-shrink-0" />
			</div>
		</Link>
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div className="space-y-3">
					{Array.from({ length: Math.min(limit, 3) }).map(() => (
						<div key={crypto.randomUUID()} className="p-3 rounded-lg border border-transparent">
							<Skeleton className="h-4 w-3/4 mb-1" />
							<Skeleton className="h-3 w-1/2 mb-2" />
							<div className="flex gap-2">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-8" />
								<Skeleton className="h-4 w-16" />
							</div>
						</div>
					))}
				</div>
			);
		}

		if (error) {
			return (
				<div className="text-center py-4">
					<p className="text-muted-foreground text-sm">{error}</p>
				</div>
			);
		}

		if (bookmarks.length === 0) {
			return (
				<div className="text-center py-6">
					<BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
					<p className="text-muted-foreground text-sm">ブックマークした記事がありません</p>
					<p className="text-muted-foreground text-xs mt-1">
						気になる記事を見つけたらブックマークしてみましょう
					</p>
				</div>
			);
		}

		return <div className="space-y-3">{bookmarks.map(renderBookmarkItem)}</div>;
	};

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base font-medium flex items-center gap-2">
						<Bookmark className="h-4 w-4" />
						最近のブックマーク
						{!loading && bookmarks.length > 0 && (
							<span className="text-sm font-normal text-muted-foreground">
								({bookmarks.length}件)
							</span>
						)}
					</CardTitle>
					{!loading && bookmarks.length > 0 && (
						<Button variant="ghost" size="sm" asChild>
							<Link href="/profile/bookmarks" className="flex items-center gap-1">
								<span className="text-xs">すべて見る</span>
								<ArrowRight className="h-3 w-3" />
							</Link>
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>{renderContent()}</CardContent>
		</Card>
	);
}
