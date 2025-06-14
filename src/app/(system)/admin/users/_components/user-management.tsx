"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, Users, Crown, Calendar, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllUsers, type UserListItem, type GetUsersParams } from "@/app/_actions/admin/users";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export function UserManagement() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [users, setUsers] = useState<UserListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);

	// スケルトンローディング用の固定キー
	const skeletonKeys = useMemo(
		() => Array.from({ length: 5 }, (_, i) => `user-skeleton-${Date.now()}-${i}`),
		[],
	);

	// フィルター・検索・ソート状態
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [filter, setFilter] = useState<"all" | "admin" | "regular">(
		(searchParams.get("filter") as "all" | "admin" | "regular") || "all",
	);
	const [sortBy, setSortBy] = useState<"created_at" | "display_name" | "last_sign_in_at">(
		(searchParams.get("sortBy") as "created_at" | "display_name" | "last_sign_in_at") ||
			"created_at",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		(searchParams.get("sortOrder") as "asc" | "desc") || "desc",
	);
	const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

	// ユーザー一覧を取得
	const fetchUsers = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const params: GetUsersParams = {
				page,
				limit: 20,
				search: search || undefined,
				filter,
				sortBy,
				sortOrder,
			};

			const result = await getAllUsers(params);
			setUsers(result.users);
			setTotal(result.total);
			setHasMore(result.hasMore);
		} catch (err) {
			setError(err instanceof Error ? err.message : "ユーザー一覧の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [page, search, filter, sortBy, sortOrder]);

	// URLパラメータを更新
	const updateURL = useCallback(() => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (filter !== "all") params.set("filter", filter);
		if (sortBy !== "created_at") params.set("sortBy", sortBy);
		if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
		if (page !== 1) params.set("page", page.toString());

		const newURL = params.toString() ? `?${params.toString()}` : "";
		router.replace(`/admin/users${newURL}`, { scroll: false });
	}, [search, filter, sortBy, sortOrder, page, router]);

	// 初回読み込み
	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// URLパラメータ更新
	useEffect(() => {
		updateURL();
	}, [updateURL]);

	// 検索実行
	const handleSearch = () => {
		setPage(1);
		fetchUsers();
	};

	// フィルター変更
	const handleFilterChange = (newFilter: "all" | "admin" | "regular") => {
		setFilter(newFilter);
		setPage(1);
	};

	// ソート変更
	const handleSortChange = (newSortBy: "created_at" | "display_name" | "last_sign_in_at") => {
		if (newSortBy === sortBy) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(newSortBy);
			setSortOrder("desc");
		}
		setPage(1);
	};

	// ページ変更
	const handlePageChange = (newPage: number) => {
		setPage(newPage);
	};

	// ユーザー詳細へ遷移
	const handleUserClick = (userId: string) => {
		router.push(`/admin/users/${userId}`);
	};

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>{error}</p>
						<Button onClick={fetchUsers} className="mt-4">
							再試行
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

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
								<Input
									placeholder="表示名で検索..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								/>
								<Button onClick={handleSearch}>検索</Button>
							</div>
						</div>

						<div className="flex gap-2">
							<Select value={filter} onValueChange={handleFilterChange}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全ユーザー</SelectItem>
									<SelectItem value="admin">管理者のみ</SelectItem>
									<SelectItem value="regular">一般ユーザー</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sortBy} onValueChange={handleSortChange}>
								<SelectTrigger className="w-40">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="created_at">登録日順</SelectItem>
									<SelectItem value="display_name">名前順</SelectItem>
									<SelectItem value="last_sign_in_at">最終ログイン順</SelectItem>
								</SelectContent>
							</Select>
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
								<p className="text-2xl font-bold">{total.toLocaleString()}</p>
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
								<p className="text-2xl font-bold">
									{users.filter((user) => user.admin_info).length}
								</p>
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
								<p className="text-2xl font-bold">
									{
										users.filter(
											(user) =>
												user.last_sign_in_at &&
												new Date(user.last_sign_in_at) >
													new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
										).length
									}
								</p>
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
						<span className="text-sm font-normal text-muted-foreground">
							{users.length} / {total} 件
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
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
								</div>
							))}
						</div>
					) : users.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>ユーザーが見つかりませんでした</p>
						</div>
					) : (
						<div className="space-y-2">
							{users.map((user) => (
								<button
									key={user.id}
									type="button"
									className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors text-left w-full"
									onClick={() => handleUserClick(user.id)}
								>
									<Avatar className="h-12 w-12">
										<AvatarImage src={user.avatar_url || undefined} />
										<AvatarFallback>{user.display_name.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-medium truncate">{user.display_name}</h3>
											{user.admin_info && (
												<Badge variant="secondary" className="text-xs">
													<Crown className="h-3 w-3 mr-1" />
													{user.admin_info.role === "super_admin" ? "スーパー管理者" : "管理者"}
												</Badge>
											)}
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>{user.email}</span>
											<span className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												登録:{" "}
												{formatDistanceToNow(new Date(user.created_at), {
													addSuffix: true,
													locale: ja,
												})}
											</span>
											{user.last_sign_in_at && (
												<span className="flex items-center gap-1">
													<Activity className="h-3 w-3" />
													最終ログイン:{" "}
													{formatDistanceToNow(new Date(user.last_sign_in_at), {
														addSuffix: true,
														locale: ja,
													})}
												</span>
											)}
										</div>
									</div>

									<div className="text-right text-sm text-muted-foreground">
										<div>
											香典帳:{" "}
											{user.stats.owned_koudens_count + user.stats.participated_koudens_count}
										</div>
										<div>記録: {user.stats.total_entries_count}</div>
									</div>
								</button>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* ページネーション */}
			{total > 20 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								{(page - 1) * 20 + 1} - {Math.min(page * 20, total)} / {total} 件
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(page - 1)}
									disabled={page === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									前へ
								</Button>

								<span className="text-sm">
									{page} / {Math.ceil(total / 20)}
								</span>

								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(page + 1)}
									disabled={!hasMore}
								>
									次へ
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
