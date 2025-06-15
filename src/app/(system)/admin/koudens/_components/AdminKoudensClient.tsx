"use client";

import { useState } from "react";
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
import {
	Search,
	ChevronLeft,
	ChevronRight,
	BookOpen,
	Users,
	DollarSign,
	Calendar,
	ArrowUpDown,
	ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import type { AdminKoudenListItem } from "@/app/_actions/admin/users";

interface AdminKoudensClientProps {
	koudens: AdminKoudenListItem[];
	total: number;
	hasMore: boolean;
	currentPage: number;
	currentSearch: string;
	currentStatus: "all" | "active" | "archived" | "inactive";
	currentSortBy: "created_at" | "updated_at" | "title" | "entries_count";
	currentSortOrder: "asc" | "desc";
}

export default function AdminKoudensClient({
	koudens,
	total,
	hasMore,
	currentPage,
	currentSearch,
	currentStatus,
	currentSortBy,
	currentSortOrder,
}: AdminKoudensClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [search, setSearch] = useState(currentSearch);

	const updateSearchParams = (updates: Record<string, string | undefined>) => {
		const params = new URLSearchParams(searchParams);

		for (const [key, value] of Object.entries(updates)) {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		}

		// ページ番号をリセット（検索・フィルタ変更時）
		if (
			updates.search !== undefined ||
			updates.status !== undefined ||
			updates.sortBy !== undefined
		) {
			params.delete("page");
		}

		router.push(`/admin/koudens?${params.toString()}`);
	};

	const handleSearch = () => {
		updateSearchParams({ search: search || undefined });
	};

	const handleStatusChange = (status: string) => {
		updateSearchParams({ status: status === "all" ? undefined : status });
	};

	const handleSortChange = (sortBy: string) => {
		const newSortOrder = currentSortBy === sortBy && currentSortOrder === "desc" ? "asc" : "desc";
		updateSearchParams({ sortBy, sortOrder: newSortOrder });
	};

	const handlePageChange = (page: number) => {
		updateSearchParams({ page: page.toString() });
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="default">アクティブ</Badge>;
			case "archived":
				return <Badge variant="secondary">アーカイブ</Badge>;
			case "inactive":
				return <Badge variant="destructive">非アクティブ</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const getPlanBadge = (planCode: string, expired: boolean) => {
		if (expired) {
			return <Badge variant="destructive">期限切れ</Badge>;
		}
		switch (planCode) {
			case "free":
				return <Badge variant="outline">無料</Badge>;
			case "basic":
				return <Badge variant="default">ベーシック</Badge>;
			case "premium":
				return <Badge variant="secondary">プレミアム</Badge>;
			default:
				return <Badge variant="outline">{planCode}</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			{/* 検索・フィルタ */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="flex gap-2">
								<Input
									placeholder="香典帳名で検索..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
									className="flex-1"
								/>
								<Button onClick={handleSearch} size="icon">
									<Search className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="flex gap-2">
							<Select value={currentStatus} onValueChange={handleStatusChange}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全て</SelectItem>
									<SelectItem value="active">アクティブ</SelectItem>
									<SelectItem value="archived">アーカイブ</SelectItem>
									<SelectItem value="inactive">非アクティブ</SelectItem>
								</SelectContent>
							</Select>

							<Select value={currentSortBy} onValueChange={handleSortChange}>
								<SelectTrigger className="w-40">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="created_at">作成日時</SelectItem>
									<SelectItem value="updated_at">更新日時</SelectItem>
									<SelectItem value="title">タイトル</SelectItem>
									<SelectItem value="entries_count">記録数</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 統計情報 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-sm text-muted-foreground">総香典帳数</p>
								<p className="text-2xl font-bold">{total}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">総記録数</p>
								<p className="text-2xl font-bold">
									{koudens.reduce((sum, k) => sum + k.stats.entries_count, 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<DollarSign className="h-5 w-5 text-purple-600" />
							<div>
								<p className="text-sm text-muted-foreground">総金額</p>
								<p className="text-2xl font-bold">
									¥{koudens.reduce((sum, k) => sum + k.stats.total_amount, 0).toLocaleString()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-orange-600" />
							<div>
								<p className="text-sm text-muted-foreground">表示中</p>
								<p className="text-2xl font-bold">{koudens.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 香典帳一覧 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5" />
						香典帳一覧
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleSortChange(currentSortBy)}
							className="ml-auto"
						>
							<ArrowUpDown className="h-4 w-4" />
							{currentSortOrder === "asc" ? "昇順" : "降順"}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{koudens.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>香典帳が見つかりませんでした</p>
						</div>
					) : (
						<div className="divide-y">
							{koudens.map((kouden) => (
								<div key={kouden.id} className="p-4 hover:bg-muted/50 transition-colors">
									<div className="flex items-start gap-4">
										<Avatar className="h-12 w-12">
											<AvatarImage src={kouden.owner.avatar_url || ""} />
											<AvatarFallback>{kouden.owner.display_name.charAt(0)}</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h3 className="font-semibold truncate">{kouden.title}</h3>
														{getStatusBadge(kouden.status)}
														{getPlanBadge(kouden.plan.code, kouden.expired)}
													</div>

													<p className="text-sm text-muted-foreground mb-2">
														オーナー: {kouden.owner.display_name}
													</p>

													{kouden.description && (
														<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
															{kouden.description}
														</p>
													)}

													<div className="flex items-center gap-4 text-sm text-muted-foreground">
														<span className="flex items-center gap-1">
															<Users className="h-4 w-4" />
															記録: {kouden.stats.entries_count}
														</span>
														<span className="flex items-center gap-1">
															<Users className="h-4 w-4" />
															メンバー: {kouden.stats.members_count}
														</span>
														<span className="flex items-center gap-1">
															<DollarSign className="h-4 w-4" />¥
															{kouden.stats.total_amount.toLocaleString()}
														</span>
													</div>
												</div>

												<div className="flex flex-col items-end gap-2">
													<div className="text-right text-sm text-muted-foreground">
														<div>
															作成:{" "}
															{format(new Date(kouden.created_at), "yyyy/MM/dd", { locale: ja })}
														</div>
														<div>
															更新:{" "}
															{format(new Date(kouden.updated_at), "yyyy/MM/dd", { locale: ja })}
														</div>
													</div>

													<Link href={`/admin/koudens/${kouden.id}`}>
														<Button variant="outline" size="sm">
															<ExternalLink className="h-4 w-4 mr-1" />
															詳細
														</Button>
													</Link>
												</div>
											</div>
										</div>
									</div>
								</div>
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
								{(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, total)} / {total} 件
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									前へ
								</Button>

								<span className="text-sm">
									{currentPage} / {Math.ceil(total / 20)}
								</span>

								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage + 1)}
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
