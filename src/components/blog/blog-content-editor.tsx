"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, FileText } from "lucide-react";

// MDEditorを動的インポート（SSR対策）
const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), {
	ssr: false,
});

interface BlogContentEditorProps {
	content: string;
	onContentChange: (content: string) => void;
	onSave?: () => Promise<void>;
	className?: string;
	readOnly?: boolean;
}

/**
 * リアルタイムプレビュー付きのMarkdownエディターコンポーネント
 * 記事の本文編集機能を提供
 */
export function BlogContentEditor({
	content,
	onContentChange,
	onSave,
	className,
	readOnly = false,
}: BlogContentEditorProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "live">("live");
	const [wordCount, setWordCount] = useState(0);

	// 文字数カウント
	const updateWordCount = useCallback((text: string) => {
		const words = text
			.replace(/[^\w\s]/gi, "")
			.split(/\s+/)
			.filter(Boolean);
		setWordCount(words.length);
	}, []);

	const handleContentChange = useCallback(
		(value?: string) => {
			const newContent = value || "";
			onContentChange(newContent);
			updateWordCount(newContent);
		},
		[onContentChange, updateWordCount],
	);

	const handleSave = async () => {
		if (!onSave) return;

		setIsSaving(true);
		try {
			await onSave();
		} finally {
			setIsSaving(false);
		}
	};

	// 初期文字数カウント
	useState(() => {
		updateWordCount(content);
	});

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<FileText className="h-5 w-5" />
						記事内容
					</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							{wordCount} words
						</Badge>
						{!readOnly && (
							<div className="flex items-center gap-1">
								<Button
									variant={previewMode === "edit" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewMode("edit")}
								>
									編集
								</Button>
								<Button
									variant={previewMode === "live" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewMode("live")}
								>
									<Eye className="h-4 w-4 mr-1" />
									分割
								</Button>
								<Button
									variant={previewMode === "preview" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewMode("preview")}
								>
									<EyeOff className="h-4 w-4 mr-1" />
									プレビュー
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="min-h-[500px]">
					<MDEditor
						value={content}
						onChange={handleContentChange}
						preview={previewMode}
						hideToolbar={readOnly}
						visibleDragbar={false}
						data-color-mode="light"
						height={500}
						textareaProps={{
							placeholder:
								"ここに記事の内容をMarkdown記法で入力してください...\n\n# 見出し1\n## 見出し2\n\n**太字** *斜体*\n\n- リスト項目1\n- リスト項目2\n\n```javascript\n// コードブロック\nconsole.log('Hello World');\n```\n\n> 引用文\n\n[リンクテキスト](https://example.com)",
							readOnly,
						}}
					/>
				</div>

				{onSave && !readOnly && (
					<div className="pt-4 border-t mt-4">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Markdownで記述できます。リアルタイムでプレビューが表示されます。
							</p>
							<Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
								<Save className="h-4 w-4" />
								{isSaving ? "保存中..." : "内容を保存"}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
