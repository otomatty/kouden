"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Calendar, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserBookmarks, toggleBookmark } from "@/app/_actions/blog/bookmarks";
import { toast } from "sonner";
import type { BookmarkInfo } from "@/types/blog";

interface UserBookmarksProps {
	className?: string;
	limit?: number;
	showRemoveButton?: boolean;
}

/**
 * ユーザーブックマーク一覧コンポーネント
 * プロフィールページ等でユーザーのブックマーク記事を表示
 *
 * @param className - 追加のCSSクラス
 * @param limit - 表示する記事数（未指定の場合は全件）
 * @param showRemoveButton - 削除ボタン表示の有無
 */
export function UserBookmarks({
	className = "",
	limit,
	showRemoveButton = true,
}: UserBookmarksProps) {
	const [bookmarks, setBookmarks] = useState<BookmarkInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		const fetchBookmarks = async () => {
			try {
				setLoading(true);
				setError(null);
				const { data, error: fetchError } = await getUserBookmarks();

				if (fetchError) {
					throw new Error(fetchError);
				}

				// 型安全な変換
				const transformedData = (data || []).map((bookmark) => ({
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
				})) as BookmarkInfo[];

				// limitが指定されている場合はスライス
				const finalData = limit ? transformedData.slice(0, limit) : transformedData;
				setBookmarks(finalData);
			} catch (err) {
				console.error("Failed to fetch bookmarks:", err);
				setError("ブックマークの取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchBookmarks();
	}, [limit]);

	const handleRemoveBookmark = async (postId: string, bookmarkId: string) => {
		if (!showRemoveButton) return;

		setRemovingIds((prev) => new Set(prev).add(bookmarkId));

		try {
			const result = await toggleBookmark(postId);

			if (result.success) {
				// ブックマーク一覧から削除
				setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));

				toast.success("ブックマークから削除しました", {
					description: "記事がブックマークから削除されました",
				});
			} else {
				throw new Error(result.error || "削除に失敗しました");
			}
		} catch (err) {
			console.error("Failed to remove bookmark:", err);
			toast.error("削除に失敗しました", {
				description: "しばらく時間をおいて再度お試しください",
			});
		} finally {
			setRemovingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(bookmarkId);
				return newSet;
			});
		}
	};

	const renderBookmarkItem = (bookmark: BookmarkInfo) => (
		<div
			key={bookmark.id}
			className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
		>
			<div className="flex-1 min-w-0">
				<Link
					href={`/blog/${bookmark.post.slug}`}
					className="block hover:text-primary transition-colors"
				>
					<h4 className="font-medium line-clamp-2 text-sm leading-tight mb-2">
						{bookmark.post.title}
					</h4>
				</Link>

				{bookmark.post.excerpt && (
					<p className="text-xs text-muted-foreground line-clamp-2 mb-3">{bookmark.post.excerpt}</p>
				)}

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						{bookmark.post.category && (
							<Badge variant="outline" className="text-xs px-2 py-0.5">
								{bookmark.post.category}
							</Badge>
						)}

						{bookmark.post.post_stats && (
							<>
								<div className="flex items-center gap-1">
									<Eye className="h-3 w-3" />
									<span>{bookmark.post.post_stats.view_count.toLocaleString()}</span>
								</div>
								<div className="flex items-center gap-1">
									<Bookmark className="h-3 w-3" />
									<span>{bookmark.post.post_stats.bookmark_count.toLocaleString()}</span>
								</div>
							</>
						)}

						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>
								{new Date(bookmark.created_at).toLocaleDateString("ja-JP", {
									year: "numeric",
									month: "short",
									day: "numeric",
								})}
							</span>
						</div>
					</div>

					{showRemoveButton && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleRemoveBookmark(bookmark.post.id, bookmark.id)}
							disabled={removingIds.has(bookmark.id)}
							className="ml-2 text-muted-foreground hover:text-destructive"
							aria-label="ブックマークから削除"
						>
							<Trash2
								className={`h-3 w-3 ${removingIds.has(bookmark.id) ? "animate-pulse" : ""}`}
							/>
						</Button>
					)}
				</div>
			</div>
		</div>
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div className="space-y-4">
					{Array.from({ length: Math.min(limit || 5, 5) }).map(() => (
						<div key={crypto.randomUUID()} className="p-4 border border-border rounded-lg">
							<Skeleton className="h-4 w-3/4 mb-2" />
							<Skeleton className="h-3 w-1/2 mb-3" />
							<div className="flex justify-between items-center">
								<div className="flex gap-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-20" />
								</div>
								{showRemoveButton && <Skeleton className="h-6 w-6" />}
							</div>
						</div>
					))}
				</div>
			);
		}

		if (error) {
			return (
				<div className="text-center py-8">
					<p className="text-muted-foreground text-sm">{error}</p>
				</div>
			);
		}

		if (bookmarks.length === 0) {
			return (
				<div className="text-center py-8">
					<Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
					<p className="text-muted-foreground text-sm">ブックマークした記事がありません</p>
					<p className="text-muted-foreground text-xs mt-1">
						気になる記事を見つけたらブックマークしてみましょう
					</p>
				</div>
			);
		}

		return <div className="space-y-4">{bookmarks.map(renderBookmarkItem)}</div>;
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bookmark className="h-5 w-5" />
					ブックマーク
					{!loading && bookmarks.length > 0 && (
						<span className="text-sm font-normal text-muted-foreground">
							({bookmarks.length}件)
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>{renderContent()}</CardContent>
		</Card>
	);
}
