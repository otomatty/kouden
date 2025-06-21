"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Bookmark, Calendar, Eye, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { getUserBookmarks, toggleBookmark } from "@/app/_actions/blog/bookmarks";
import { toast } from "sonner";
import type { BookmarkInfo } from "@/types/blog";

interface BookmarksListProps {
	category?: string;
	sortBy: string;
	search?: string;
}

// ページネーション設定
const ITEMS_PER_PAGE = 12;

/**
 * ブックマーク一覧表示コンポーネント
 */
export function BookmarksList({ category, sortBy, search }: BookmarksListProps) {
	const [bookmarks, setBookmarks] = useState<BookmarkInfo[]>([]);
	const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
	const [currentPage, setCurrentPage] = useState(1);

	const searchParams = useSearchParams();
	const router = useRouter();

	// データ取得
	useEffect(() => {
		const fetchBookmarksData = async () => {
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

				setBookmarks(transformedData);
			} catch (err) {
				console.error("Failed to fetch bookmarks:", err);
				setError("ブックマークの取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchBookmarksData();
	}, []);

	// フィルタリング・ソート処理
	useEffect(() => {
		let filtered = [...bookmarks];

		// カテゴリフィルタ
		if (category) {
			filtered = filtered.filter((bookmark) => bookmark.post.category === category);
		}

		// 検索フィルタ
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(bookmark) =>
					bookmark.post.title.toLowerCase().includes(searchLower) ||
					(bookmark.post.excerpt?.toLowerCase().includes(searchLower) ?? false),
			);
		}

		// ソート
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "bookmark_date_asc":
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
				case "bookmark_date_desc":
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				case "publish_date_asc":
					return new Date(a.post.published_at).getTime() - new Date(b.post.published_at).getTime();
				case "publish_date_desc":
					return new Date(b.post.published_at).getTime() - new Date(a.post.published_at).getTime();
				case "title_asc":
					return a.post.title.localeCompare(b.post.title);
				case "title_desc":
					return b.post.title.localeCompare(a.post.title);
				case "view_count_asc":
					return (a.post.post_stats?.view_count || 0) - (b.post.post_stats?.view_count || 0);
				case "view_count_desc":
					return (b.post.post_stats?.view_count || 0) - (a.post.post_stats?.view_count || 0);
				default:
					return a.post.title.localeCompare(b.post.title);
			}
		});

		setFilteredBookmarks(filtered);
		setCurrentPage(1); // フィルタ変更時はページを1に戻す
	}, [bookmarks, category, search, sortBy]);

	// ページネーション計算
	const totalPages = Math.ceil(filteredBookmarks.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentBookmarksPage = filteredBookmarks.slice(startIndex, endIndex);

	// ブックマーク削除
	const handleRemoveBookmark = async (postId: string, bookmarkId: string) => {
		setRemovingIds((prev) => new Set(prev).add(bookmarkId));

		try {
			const result = await toggleBookmark(postId);

			if (result.success) {
				// ローカル状態から削除
				setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
				toast.success("ブックマークから削除しました");
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

	// ページ変更
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		const params = new URLSearchParams(searchParams);
		if (page > 1) {
			params.set("page", page.toString());
		} else {
			params.delete("page");
		}
		router.push(`/profile/bookmarks?${params.toString()}`, { scroll: false });
	};

	// ブックマーク項目レンダリング
	const renderBookmarkItem = (bookmark: BookmarkInfo) => (
		<Card key={bookmark.id} className="hover:shadow-md transition-shadow">
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<Link
							href={`/blog/${bookmark.post.slug}`}
							className="block hover:text-primary transition-colors"
						>
							<h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
								{bookmark.post.title}
							</h3>
						</Link>

						{bookmark.post.excerpt && (
							<p className="text-xs text-muted-foreground line-clamp-2 mb-3">
								{bookmark.post.excerpt}
							</p>
						)}

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								{bookmark.post.category && (
									<Badge variant="outline" className="text-xs px-2 py-0.5">
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
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
							</div>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										disabled={removingIds.has(bookmark.id)}
										className="text-muted-foreground hover:text-destructive"
									>
										<Trash2
											className={`h-4 w-4 ${removingIds.has(bookmark.id) ? "animate-pulse" : ""}`}
										/>
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center gap-2">
											<AlertCircle className="h-5 w-5 text-destructive" />
											ブックマークを削除
										</AlertDialogTitle>
										<AlertDialogDescription>
											「{bookmark.post.title}」をブックマークから削除しますか？
											<br />
											この操作は取り消せません。
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>キャンセル</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleRemoveBookmark(bookmark.post.id, bookmark.id)}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											削除する
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	// ローディング状態
	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: ITEMS_PER_PAGE }).map(() => (
					<Card key={crypto.randomUUID()}>
						<CardContent className="p-4">
							<Skeleton className="h-4 w-3/4 mb-2" />
							<Skeleton className="h-3 w-1/2 mb-3" />
							<div className="flex justify-between items-center">
								<div className="flex gap-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-20" />
								</div>
								<Skeleton className="h-8 w-8" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	// エラー状態
	if (error) {
		return (
			<div className="text-center py-12">
				<AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
				<p className="text-lg font-medium text-destructive mb-2">エラーが発生しました</p>
				<p className="text-muted-foreground">{error}</p>
			</div>
		);
	}

	// 空の状態
	if (filteredBookmarks.length === 0) {
		return (
			<div className="text-center py-12">
				<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
				<p className="text-lg font-medium mb-2">
					{search || category ? "該当するブックマークが見つかりません" : "ブックマークがありません"}
				</p>
				<p className="text-muted-foreground">
					{search || category
						? "検索条件やフィルターを変更してお試しください"
						: "気になる記事を見つけたらブックマークしてみましょう"}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* 結果サマリー */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{filteredBookmarks.length}件のブックマーク
					{(search || category) && ` (${bookmarks.length}件中)`}
				</p>
				<p className="text-sm text-muted-foreground">
					{currentPage} / {totalPages} ページ
				</p>
			</div>

			{/* ブックマーク一覧 */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{currentBookmarksPage.map(renderBookmarkItem)}
			</div>

			{/* ページネーション */}
			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
								className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
							/>
						</PaginationItem>

						{/* ページ番号 */}
						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							const pageNum = i + 1;
							return (
								<PaginationItem key={pageNum}>
									<PaginationLink
										onClick={() => handlePageChange(pageNum)}
										isActive={currentPage === pageNum}
										className="cursor-pointer"
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							);
						})}

						{totalPages > 5 && (
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
						)}

						<PaginationItem>
							<PaginationNext
								onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
								className={
									currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}
