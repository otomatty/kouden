"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { generateSlugFromTitle, generateSlugFromTitleSync } from "@/utils/slug-generator";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

interface BlogMetadataEditorProps {
	metadata: BlogMetadata;
	organizations?: Organization[];
	mode?: "admin" | "organization";
	onMetadataChange: (metadata: BlogMetadata) => void;
	onSave?: () => Promise<void>;
	className?: string;
}

type FormData = {
	title: string;
	slug: string;
	status: "draft" | "published";
	organization_id: string;
};

/**
 * ブログ記事のメタデータを編集するコンポーネント
 * タイトル、スラッグ、組織、ステータスの編集機能を提供
 */
export function BlogMetadataEditor({
	metadata,
	organizations = [],
	mode = "organization",
	onMetadataChange,
	onSave,
	className,
}: BlogMetadataEditorProps) {
	const [isSaving, setIsSaving] = useState(false);

	const {
		register,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<FormData>({
		defaultValues: {
			title: metadata.title,
			slug: metadata.slug,
			status: metadata.status,
			organization_id: metadata.organization_id,
		},
	});

	const statusValue = watch("status");
	const organizationValue = watch("organization_id");

	// propsのmetadataが変更されたときにフォームの値を更新
	useEffect(() => {
		setValue("title", metadata.title);
		setValue("slug", metadata.slug);
		setValue("status", metadata.status);
		setValue("organization_id", metadata.organization_id);
	}, [metadata, setValue]);

	// フォームデータの変更を親コンポーネントに通知
	const handleFormChange = (field: keyof BlogMetadata, value: string) => {
		setValue(field, value);
		onMetadataChange({
			...metadata,
			[field]: value,
		});
	};

	// タイトルからスラッグを自動生成
	const generateSlug = async (title: string) => {
		if (!title.trim()) return;

		try {
			// 非同期でslugを生成（日本語→英語翻訳対応）
			const slug = await generateSlugFromTitle(title);
			handleFormChange("slug", slug);
		} catch (error) {
			console.error("Slug generation failed:", error);
			// フォールバックとして同期版を使用
			const fallbackSlug = generateSlugFromTitleSync(title);
			handleFormChange("slug", fallbackSlug);
		}
	};

	const handleSave = async () => {
		if (!onSave) return;

		setIsSaving(true);
		try {
			await onSave();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-lg">記事情報</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title">タイトル</Label>
					<Input
						id="title"
						{...register("title", {
							onChange: (e) => {
								handleFormChange("title", e.target.value);
								generateSlug(e.target.value);
							},
						})}
						placeholder="記事のタイトルを入力してください"
					/>
					{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
				</div>

				<div className="space-y-2">
					<Label htmlFor="slug">スラッグ（URL）</Label>
					<Input
						id="slug"
						{...register("slug", {
							onChange: (e) => handleFormChange("slug", e.target.value),
						})}
						placeholder="article-slug"
					/>
					<p className="text-sm text-muted-foreground">
						記事のURL部分になります（例: /blog/article-slug）
					</p>
					{errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
				</div>

				{/* 組織選択 */}
				{organizations.length > 0 && (
					<div className="space-y-2">
						<Label htmlFor="organization">組織</Label>
						{mode === "admin" ? (
							<Select
								value={organizationValue || "none"}
								onValueChange={(value) => {
									const orgId = value === "none" ? "" : value;
									handleFormChange("organization_id", orgId);
								}}
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
					<Label htmlFor="status">ステータス</Label>
					<Select
						value={statusValue}
						onValueChange={(value) => handleFormChange("status", value as "draft" | "published")}
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

				{onSave && (
					<div className="pt-4 border-t">
						<Button onClick={handleSave} disabled={isSaving || !isDirty} className="w-full">
							{isSaving ? "保存中..." : "メタデータを保存"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
