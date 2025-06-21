"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Eye, Bookmark } from "lucide-react";
import { getRelatedPosts } from "@/app/_actions/blog/analytics";
import type { RelatedPost } from "@/types/blog";

interface RelatedPostsProps {
	currentPostId: string;
	category?: string;
	tags?: string[];
	limit?: number;
	className?: string;
}

/**
 * 関連記事表示コンポーネント
 * カテゴリとタグの類似度に基づいて関連記事を表示
 *
 * @param currentPostId - 現在の記事ID
 * @param category - 記事のカテゴリ
 * @param tags - 記事のタグ
 * @param limit - 表示する記事数
 * @param className - 追加のCSSクラス
 */
export function RelatedPosts({
	currentPostId,
	category,
	tags,
	limit = 3,
	className = "",
}: RelatedPostsProps) {
	const [posts, setPosts] = useState<RelatedPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRelatedPosts = async () => {
			try {
				setLoading(true);
				setError(null);

				const { data, error: fetchError } = await getRelatedPosts(currentPostId, {
					category,
					tags,
					limit,
				});

				if (fetchError) {
					throw new Error(fetchError);
				}

				setPosts(
					(data || []).map((post) => ({
						...post,
						excerpt: post.excerpt ?? "",
						category: post.category ?? undefined,
						tags: post.tags ?? undefined,
						published_at: post.published_at ?? "",
						view_count: post.post_stats?.view_count ?? 0,
						bookmark_count: post.post_stats?.bookmark_count ?? 0,
					})) as RelatedPost[],
				);
			} catch (err) {
				console.error("Failed to fetch related posts:", err);
				setError("関連記事の取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		if (currentPostId) {
			fetchRelatedPosts();
		}
	}, [currentPostId, category, tags, limit]);

	const renderPostItem = (post: RelatedPost) => (
		<div key={post.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
			<Link href={`/blog/${post.slug}`} className="block hover:text-primary transition-colors">
				<h4 className="font-medium line-clamp-2 text-sm leading-tight mb-2">{post.title}</h4>
			</Link>

			{post.excerpt && (
				<p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
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
									year: "numeric",
									month: "short",
									day: "numeric",
								})}
							</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<div className="flex items-center gap-1">
						<Eye className="h-3 w-3" />
						<span>{post.view_count.toLocaleString()}</span>
					</div>

					<div className="flex items-center gap-1">
						<Bookmark className="h-3 w-3" />
						<span>{post.bookmark_count.toLocaleString()}</span>
					</div>
				</div>
			</div>

			{/* タグ表示（共通タグがある場合） */}
			{post.tags && tags && post.tags.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1">
					{post.tags
						.filter((tag) => tags.includes(tag))
						.slice(0, 3)
						.map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
								{tag}
							</Badge>
						))}
				</div>
			)}
		</div>
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div className="space-y-4">
					{Array.from({ length: Math.min(limit, 3) }).map(() => (
						<div key={crypto.randomUUID()} className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-3 w-3/4" />
							<div className="flex justify-between items-center">
								<div className="flex gap-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-20" />
								</div>
								<div className="flex gap-2">
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-8" />
								</div>
							</div>
						</div>
					))}
				</div>
			);
		}

		if (error) {
			return (
				<div className="text-center py-6">
					<p className="text-muted-foreground text-sm">{error}</p>
				</div>
			);
		}

		if (posts.length === 0) {
			return (
				<div className="text-center py-6">
					<BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
					<p className="text-muted-foreground text-sm">関連記事が見つかりませんでした</p>
				</div>
			);
		}

		return <div className="space-y-4">{posts.map(renderPostItem)}</div>;
	};

	// 関連記事がない場合は何も表示しない
	if (loading || error) {
		// ローディング中やエラー時は通常表示
	} else if (posts.length === 0) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<BookOpen className="h-4 w-4" />
					関連記事
				</CardTitle>
			</CardHeader>
			<CardContent>{renderContent()}</CardContent>
		</Card>
	);
}
