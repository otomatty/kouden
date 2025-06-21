"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, Eye, Bookmark } from "lucide-react";
import { getPopularPosts } from "@/app/_actions/blog/analytics";
import type { PopularPost } from "@/types/blog";

interface PopularPostsProps {
	className?: string;
	limit?: number;
	showTabs?: boolean;
	defaultPeriod?: "week" | "month" | "all";
}

/**
 * 人気記事一覧コンポーネント
 * 期間別フィルタリングと適切なローディング状態を提供
 *
 * @param className - 追加のCSSクラス
 * @param limit - 表示する記事数
 * @param showTabs - 期間タブ表示の有無
 * @param defaultPeriod - デフォルトの期間
 */
export function PopularPosts({
	className = "",
	limit = 10,
	showTabs = true,
	defaultPeriod = "week",
}: PopularPostsProps) {
	const [posts, setPosts] = useState<PopularPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [period, setPeriod] = useState<"week" | "month" | "all">(defaultPeriod);

	const fetchPosts = useCallback(
		async (selectedPeriod: "week" | "month" | "all") => {
			try {
				setLoading(true);
				setError(null);
				const { data, error: fetchError } = await getPopularPosts(limit, selectedPeriod);

				if (fetchError) {
					throw new Error(fetchError);
				}

				// データ変換（null を undefined に変換）
				const transformedData = (data || []).map((post) => ({
					...post,
					excerpt: post.excerpt ?? undefined,
					category: post.category ?? undefined,
					published_at: post.published_at ?? undefined,
				})) as PopularPost[];

				setPosts(transformedData);
			} catch (err) {
				console.error("Failed to fetch popular posts:", err);
				setError("人気記事の取得に失敗しました");
			} finally {
				setLoading(false);
			}
		},
		[limit],
	);

	useEffect(() => {
		fetchPosts(period);
	}, [period, fetchPosts]);

	const handlePeriodChange = (newPeriod: string) => {
		setPeriod(newPeriod as "week" | "month" | "all");
	};

	const skeletonItems = useMemo(
		() =>
			Array.from({ length: Math.min(limit, 5) }, () => (
				<div key={crypto.randomUUID()} className="flex items-start gap-3 p-3">
					<Skeleton className="w-8 h-8 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
						<div className="flex gap-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-8" />
							<Skeleton className="h-4 w-8" />
						</div>
					</div>
				</div>
			)),
		[limit],
	);

	const renderPostItem = (post: PopularPost, index: number) => (
		<div
			key={post.id}
			className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
		>
			<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
				{index + 1}
			</div>
			<div className="flex-1 min-w-0">
				<Link href={`/blog/${post.slug}`} className="block hover:text-primary transition-colors">
					<h4 className="font-medium line-clamp-2 text-sm leading-tight mb-2">{post.title}</h4>
				</Link>

				{post.excerpt && (
					<p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
				)}

				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					{post.category && (
						<Badge variant="secondary" className="text-xs px-2 py-0.5">
							{post.category}
						</Badge>
					)}

					<div className="flex items-center gap-1">
						<Eye className="h-3 w-3" />
						<span>{post.view_count.toLocaleString()}</span>
					</div>

					<div className="flex items-center gap-1">
						<Bookmark className="h-3 w-3" />
						<span>{post.bookmark_count.toLocaleString()}</span>
					</div>

					{post.published_at && (
						<div className="flex items-center gap-1">
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
		</div>
	);

	const renderContent = () => {
		if (loading) {
			return <div className="space-y-3">{skeletonItems}</div>;
		}

		if (error) {
			return (
				<div className="text-center py-8">
					<p className="text-muted-foreground text-sm">{error}</p>
					<button
						type="button"
						onClick={() => fetchPosts(period)}
						className="text-primary text-sm hover:underline mt-2"
					>
						再試行
					</button>
				</div>
			);
		}

		if (posts.length === 0) {
			return (
				<div className="text-center py-8">
					<TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
					<p className="text-muted-foreground text-sm">人気記事がまだありません</p>
				</div>
			);
		}

		return (
			<div className="space-y-1">{posts.map((post, index) => renderPostItem(post, index))}</div>
		);
	};

	if (!showTabs) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						人気記事
					</CardTitle>
				</CardHeader>
				<CardContent>{renderContent()}</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					人気記事
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs value={period} onValueChange={handlePeriodChange} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="week" className="text-xs">
							週間
						</TabsTrigger>
						<TabsTrigger value="month" className="text-xs">
							月間
						</TabsTrigger>
						<TabsTrigger value="all" className="text-xs">
							全期間
						</TabsTrigger>
					</TabsList>

					<TabsContent value={period} className="mt-4">
						{renderContent()}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
