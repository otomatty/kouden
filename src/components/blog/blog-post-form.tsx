"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createPost, updatePost } from "@/app/_actions/blog/posts";
import { CreatePostSchema, type UpdatePostSchema } from "@/schemas/posts";
import type { TPost } from "@/types/post";

interface Organization {
	id: string;
	name: string;
}

interface BlogPostFormProps {
	organizations?: Organization[];
	defaultOrganizationId: string | null;
	basePath: string;
	post?: TPost; // 編集の場合のみ
	mode?: "admin" | "organization"; // 管理者モードか組織モードか
}

type FormData = z.infer<typeof CreatePostSchema>;

export function BlogPostForm({
	organizations = [],
	defaultOrganizationId,
	basePath,
	post,
	mode = "organization",
}: BlogPostFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEdit = !!post;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(CreatePostSchema),
		defaultValues: {
			title: post?.title || "",
			content: post?.content || "",
			slug: post?.slug || "",
			status: (post?.status || "draft") as "draft" | "published",
			organization_id: post?.organization_id || defaultOrganizationId || "",
		},
	});

	const statusValue = watch("status");
	const organizationValue = watch("organization_id");

	// タイトルからスラッグを自動生成（新規作成時のみ）
	const generateSlug = (title: string) => {
		if (isEdit) return; // 編集時は自動生成しない

		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "") // 英数字とスペース、ハイフンのみ残す
			.replace(/\s+/g, "-") // スペースをハイフンに
			.replace(/-+/g, "-") // 連続するハイフンを1つに
			.trim();

		setValue("slug", slug);
	};

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);

		try {
			if (isEdit && post) {
				const updateData: z.infer<typeof UpdatePostSchema> = {
					title: data.title,
					content: data.content,
					slug: data.slug,
					status: data.status,
				};

				const { error } = await updatePost(post.id, updateData);
				if (error) {
					alert(`更新に失敗しました: ${error}`);
					return;
				}
			} else {
				const { error } = await createPost(data);
				if (error) {
					alert(`作成に失敗しました: ${error}`);
					return;
				}
			}

			router.push(`${basePath}/blog`);
		} catch {
			alert("処理中にエラーが発生しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isEdit ? "記事を編集" : "新しい記事を作成"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="title">タイトル</Label>
						<Input
							id="title"
							{...register("title", {
								onChange: (e) => generateSlug(e.target.value),
							})}
							placeholder="記事のタイトルを入力してください"
						/>
						{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="slug">スラッグ（URL）</Label>
						<Input id="slug" {...register("slug")} placeholder="article-slug" />
						<p className="text-sm text-muted-foreground">
							記事のURL部分になります（例: /blog/article-slug）
						</p>
						{errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
					</div>

					{/* 組織選択（全ての管理画面で表示、adminのみ選択可能） */}
					{organizations.length > 0 && (
						<div className="space-y-2">
							<Label htmlFor="organization">組織</Label>
							{mode === "admin" ? (
								<Select
									value={organizationValue || "none"}
									onValueChange={(value) =>
										setValue("organization_id", value === "none" ? "" : value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="組織を選択してください" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">組織なし</SelectItem>
										{organizations.map((org) => (
											<SelectItem key={org.id} value={org.id}>
												{org.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
									{organizations.find((org) => org.id === organizationValue)?.name || "組織なし"}
								</div>
							)}
							{errors.organization_id && (
								<p className="text-sm text-destructive">{errors.organization_id.message}</p>
							)}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="content">内容</Label>
						<Textarea
							id="content"
							{...register("content")}
							placeholder="記事の内容を入力してください"
							rows={10}
						/>
						{errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="status">ステータス</Label>
						<Select
							value={statusValue}
							onValueChange={(value) => setValue("status", value as "draft" | "published")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">下書き</SelectItem>
								<SelectItem value="published">公開</SelectItem>
							</SelectContent>
						</Select>
						{errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
					</div>

					<div className="flex gap-4">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (isEdit ? "更新中..." : "作成中...") : isEdit ? "更新" : "作成"}
						</Button>
						<Button type="button" variant="outline" onClick={() => router.push(`${basePath}/blog`)}>
							キャンセル
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
