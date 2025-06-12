"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MoreHorizontal, Plus, Edit, Trash2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePost } from "@/app/_actions/blog/posts";
import type { TPost } from "@/types/post";

interface BlogPostsTableProps {
	posts: TPost[];
	basePath: string; // 各システムのベースパス (/admin, /funeral-management, etc.)
}

export function BlogPostsTable({ posts, basePath }: BlogPostsTableProps) {
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	const handleDelete = async (id: string) => {
		if (!confirm("この記事を削除してもよろしいですか？")) return;

		setIsDeleting(id);
		try {
			const { error } = await deletePost(id);
			if (error) {
				alert(`削除に失敗しました: ${error}`);
			} else {
				// ページをリロードして一覧を更新
				window.location.reload();
			}
		} catch {
			alert("削除中にエラーが発生しました");
		} finally {
			setIsDeleting(null);
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>ブログ記事管理</CardTitle>
				<Link href={`${basePath}/blog/new`}>
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						新規作成
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				{posts.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						まだ記事がありません。新規作成ボタンから記事を作成してください。
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>タイトル</TableHead>
								<TableHead>ステータス</TableHead>
								<TableHead>投稿者</TableHead>
								<TableHead>更新日</TableHead>
								<TableHead className="w-[50px]">{/* ドロップダウンメニュー */}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{posts.map((post) => (
								<TableRow key={post.id}>
									<TableCell className="font-medium">{post.title}</TableCell>
									<TableCell>
										<Badge variant={post.status === "published" ? "default" : "secondary"}>
											{post.status === "published" ? "公開" : "下書き"}
										</Badge>
									</TableCell>
									{/* TODO: 投稿者名を表示する */}
									<TableCell>{post.author_id || "不明"}</TableCell>
									<TableCell>
										{format(new Date(post.updated_at), "yyyy/MM/dd HH:mm", {
											locale: ja,
										})}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{post.status === "published" && (
													<DropdownMenuItem asChild>
														<Link href={`/blog/${post.slug}`} target="_blank">
															<Eye className="h-4 w-4 mr-2" />
															プレビュー
														</Link>
													</DropdownMenuItem>
												)}
												<DropdownMenuItem asChild>
													<Link href={`${basePath}/blog/${post.id}/edit`}>
														<Edit className="h-4 w-4 mr-2" />
														編集
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(post.id)}
													disabled={isDeleting === post.id}
													className="text-destructive"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													{isDeleting === post.id ? "削除中..." : "削除"}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
