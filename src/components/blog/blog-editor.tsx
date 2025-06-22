"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, ArrowLeft, AlertCircle, BarChart3 } from "lucide-react";

import { BlogMetadataEditor } from "./blog-metadata-editor";
import { BlogWysiwygEditor } from "./blog-wysiwyg-editor";
import { BlogAIAgent } from "./blog-ai-agent";
import { createPost, updatePost } from "@/app/_actions/blog/posts";
import type { CreatePostSchema, UpdatePostSchema } from "@/schemas/posts";
import type { TPost } from "@/types/post";
import type { z } from "zod";

interface Organization {
	id: string;
	name: string;
}

interface BlogMetadata {
	title: string;
	slug: string;
	status: "draft" | "published";
	organization_id: string;
}

interface BlogEditorProps {
	organizations?: Organization[];
	defaultOrganizationId: string | null;
	basePath: string;
	post?: TPost; // 編集の場合のみ
	mode?: "admin" | "organization"; // 管理者モードか組織モードか
}

/**
 * 統合ブログエディターコンポーネント
 * 2カラムレイアウトでメタデータ編集、WYSIWYG編集、AI支援機能を統合
 */
export function BlogEditor({
	organizations = [],
	defaultOrganizationId,
	basePath,
	post,
	mode = "organization",
}: BlogEditorProps) {
	const router = useRouter();
	const isEdit = !!post;

	// 状態管理
	const [metadata, setMetadata] = useState<BlogMetadata>({
		title: post?.title || "",
		slug: post?.slug || "",
		status: (post?.status || "draft") as "draft" | "published",
		organization_id: post?.organization_id || defaultOrganizationId || "",
	});

	const [content, setContent] = useState(post?.content || "");
	const [isSaving, setIsSaving] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// メタデータ変更ハンドラー
	const handleMetadataChange = useCallback((newMetadata: BlogMetadata) => {
		setMetadata(newMetadata);
		setHasUnsavedChanges(true);
	}, []);

	// コンテンツ変更ハンドラー
	const handleContentChange = useCallback((newContent: string) => {
		setContent(newContent);
		setHasUnsavedChanges(true);
	}, []);

	// 文字数・単語数・読了時間の計算
	const getContentStats = () => {
		const textContent = content.replace(/<[^>]*>/g, ""); // HTMLタグを除去
		const charCount = textContent.length;
		const wordCount = textContent.split(/\s+/).filter(Boolean).length;
		const readTime = Math.max(1, Math.ceil(charCount / 400));

		return { charCount, wordCount, readTime };
	};

	const { charCount, wordCount, readTime } = getContentStats();

	// 保存処理
	const handleSave = async () => {
		setIsSaving(true);

		try {
			// バリデーション
			const formData: z.infer<typeof CreatePostSchema> = {
				title: metadata.title,
				content: content,
				slug: metadata.slug,
				status: metadata.status,
				organization_id: metadata.organization_id,
			};

			if (isEdit && post) {
				const updateData: z.infer<typeof UpdatePostSchema> = {
					title: formData.title,
					content: formData.content,
					slug: formData.slug,
					status: formData.status,
				};

				const { error } = await updatePost(post.id, updateData);
				if (error) {
					alert(`更新に失敗しました: ${error}`);
					return;
				}
			} else {
				const { error } = await createPost(formData);
				if (error) {
					alert(`作成に失敗しました: ${error}`);
					return;
				}
			}

			setHasUnsavedChanges(false);
			router.push(`${basePath}/blog`);
		} catch (error) {
			console.error("Save error:", error);
			alert("処理中にエラーが発生しました");
		} finally {
			setIsSaving(false);
		}
	};

	// プレビュー機能
	const handlePreview = () => {
		// 新しいタブでプレビューを開く（実装は省略）
		console.log("Preview functionality would be implemented here");
	};

	// 戻る処理
	const handleBack = () => {
		if (hasUnsavedChanges) {
			const confirmed = window.confirm("未保存の変更があります。破棄して戻りますか？");
			if (!confirmed) return;
		}
		router.push(`${basePath}/blog`);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* ヘッダー */}
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" onClick={handleBack}>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div>
							<h1 className="text-xl font-semibold">
								{isEdit ? "記事を編集" : "新しい記事を作成"}
							</h1>
							{metadata.title && <p className="text-sm text-muted-foreground">{metadata.title}</p>}
						</div>
					</div>

					<div className="flex items-center gap-4">
						{/* 記事統計 */}
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<BarChart3 className="h-4 w-4" />
								<span>{charCount}文字</span>
							</div>
							<div className="flex items-center gap-1">
								<span>{wordCount}単語</span>
							</div>
							<div className="flex items-center gap-1">
								<span>約{readTime}分</span>
							</div>
						</div>

						<Separator orientation="vertical" className="h-6" />

						<div className="flex items-center gap-2">
							{hasUnsavedChanges && (
								<Badge variant="secondary" className="flex items-center gap-1">
									<AlertCircle className="h-3 w-3" />
									未保存
								</Badge>
							)}
							<Badge variant={metadata.status === "published" ? "default" : "secondary"}>
								{metadata.status === "published" ? "公開" : "下書き"}
							</Badge>
							<Button variant="outline" size="sm" onClick={handlePreview}>
								<Eye className="h-4 w-4 mr-2" />
								プレビュー
							</Button>
							<Button onClick={handleSave} disabled={isSaving}>
								<Save className="h-4 w-4 mr-2" />
								{isSaving ? "保存中..." : isEdit ? "更新" : "作成"}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* メインコンテンツ - 2カラムレイアウト */}
			<div className="container py-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* 左カラム: 記事情報 + コンテンツ編集 */}
					<div className="lg:col-span-2 space-y-6">
						{/* 記事情報 */}
						<BlogMetadataEditor
							metadata={metadata}
							organizations={organizations}
							mode={mode}
							onMetadataChange={handleMetadataChange}
						/>

						{/* コンテンツ編集 */}
						<BlogWysiwygEditor content={content} onContentChange={handleContentChange} />
					</div>

					{/* 右カラム: AI執筆アシスタント - Sticky固定 */}
					<div className="lg:col-span-1">
						<div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden">
							<BlogAIAgent
								metadata={metadata}
								content={content}
								onMetadataChange={handleMetadataChange}
								onContentChange={handleContentChange}
								pageType={isEdit ? "edit" : "new"}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
