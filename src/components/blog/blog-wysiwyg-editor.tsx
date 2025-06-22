"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { TIPTAP_EDITOR_STYLES } from "./blog-content-styles";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Undo,
	Redo,
	Link as LinkIcon,
	Image as ImageIcon,
	Table as TableIcon,
	FileText,
} from "lucide-react";

interface BlogWysiwygEditorProps {
	content: string;
	onContentChange: (content: string) => void;
	className?: string;
	readOnly?: boolean;
}

/**
 * Markdownコンテンツかどうかを判定する関数
 */
const isMarkdownContent = (content: string): boolean => {
	// 基本的なMarkdown記法のパターンをチェック
	const markdownPatterns = [
		/^#{1,6}\s+/m, // 見出し
		/^\*\s+/m, // リスト
		/^-\s+/m, // リスト
		/^\d+\.\s+/m, // 順序付きリスト
		/\*\*.*\*\*/m, // 太字
		/\*.*\*/m, // 斜体
		/`.*`/m, // インラインコード
		/```[\s\S]*```/m, // コードブロック
		/^\>\s+/m, // 引用
		/\[.*\]\(.*\)/m, // リンク
	];

	return markdownPatterns.some((pattern) => pattern.test(content));
};

/**
 * MarkdownをHTMLに変換する関数
 */
const convertMarkdownToHtml = async (markdown: string): Promise<string> => {
	try {
		// markedの設定
		marked.setOptions({
			breaks: true, // 改行を<br>に変換
			gfm: true, // GitHub Flavored Markdown
		});

		const html = await marked(markdown);
		return html;
	} catch (error) {
		console.error("Markdown conversion error:", error);
		return markdown; // 変換に失敗した場合は元のテキストを返す
	}
};

/**
 * TipTapベースのWYSIWYGエディターコンポーネント
 * リアルタイムプレビューと豊富な編集機能を提供
 * Markdownコンテンツを自動的にHTMLに変換して表示
 */
export function BlogWysiwygEditor({
	content,
	onContentChange,
	className,
	readOnly = false,
}: BlogWysiwygEditorProps) {
	const [initialContent, setInitialContent] = useState<string>("");
	const [isConverting, setIsConverting] = useState(false);

	// 初期コンテンツの変換処理
	useEffect(() => {
		const convertInitialContent = async () => {
			if (!content) {
				setInitialContent("");
				return;
			}

			// HTMLタグが含まれている場合はそのまま使用
			if (content.includes("<") && content.includes(">")) {
				setInitialContent(content);
				return;
			}

			// Markdownの可能性をチェック
			if (isMarkdownContent(content)) {
				setIsConverting(true);
				try {
					const htmlContent = await convertMarkdownToHtml(content);
					setInitialContent(htmlContent);
				} catch (error) {
					console.error("Failed to convert markdown:", error);
					setInitialContent(content);
				} finally {
					setIsConverting(false);
				}
			} else {
				// プレーンテキストの場合はそのまま使用
				setInitialContent(content);
			}
		};

		convertInitialContent();
	}, [content]);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-blue-600 underline hover:text-blue-800 transition-colors",
				},
			}),
			Image.configure({
				HTMLAttributes: {
					class: "max-w-full h-auto rounded-lg my-4 shadow-sm",
				},
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
		],
		content: initialContent,
		editable: !readOnly,
		onUpdate: ({ editor }) => {
			onContentChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4",
			},
		},
	});

	// 初期コンテンツが変更された時にエディターを更新
	useEffect(() => {
		if (editor && initialContent !== editor.getHTML()) {
			editor.commands.setContent(initialContent);
		}
	}, [editor, initialContent]);

	if (!editor) {
		return null;
	}

	const addLink = () => {
		const url = window.prompt("URLを入力してください:");
		if (url) {
			editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
		}
	};

	const addImage = () => {
		const url = window.prompt("画像URLを入力してください:");
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	};

	const addTable = () => {
		editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	};

	return (
		<>
			{/* 共通スタイルをページに注入 */}
			<style jsx global>
				{TIPTAP_EDITOR_STYLES}
			</style>

			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<FileText className="h-5 w-5" />
						記事内容
						{isConverting && (
							<span className="text-sm text-muted-foreground">(Markdownを変換中...)</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{!readOnly && (
						<>
							{/* ツールバー */}
							<div className="border rounded-lg p-2 mb-4">
								<div className="flex flex-wrap gap-1">
									{/* テキスト書式 */}
									<Button
										variant={editor.isActive("bold") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleBold().run()}
									>
										<Bold className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("italic") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleItalic().run()}
									>
										<Italic className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("strike") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleStrike().run()}
									>
										<Strikethrough className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("code") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleCode().run()}
									>
										<Code className="h-4 w-4" />
									</Button>

									<Separator orientation="vertical" className="h-6" />

									{/* 見出し */}
									<Button
										variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
									>
										<Heading1 className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
									>
										<Heading2 className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
									>
										<Heading3 className="h-4 w-4" />
									</Button>

									<Separator orientation="vertical" className="h-6" />

									{/* リスト */}
									<Button
										variant={editor.isActive("bulletList") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleBulletList().run()}
									>
										<List className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("orderedList") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleOrderedList().run()}
									>
										<ListOrdered className="h-4 w-4" />
									</Button>
									<Button
										variant={editor.isActive("blockquote") ? "default" : "ghost"}
										size="sm"
										onClick={() => editor.chain().focus().toggleBlockquote().run()}
									>
										<Quote className="h-4 w-4" />
									</Button>

									<Separator orientation="vertical" className="h-6" />

									{/* メディア・リンク */}
									<Button variant="ghost" size="sm" onClick={addLink}>
										<LinkIcon className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="sm" onClick={addImage}>
										<ImageIcon className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="sm" onClick={addTable}>
										<TableIcon className="h-4 w-4" />
									</Button>

									<Separator orientation="vertical" className="h-6" />

									{/* 操作 */}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => editor.chain().focus().undo().run()}
										disabled={!editor.can().undo()}
									>
										<Undo className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => editor.chain().focus().redo().run()}
										disabled={!editor.can().redo()}
									>
										<Redo className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</>
					)}

					{/* エディター */}
					<div className="border rounded-lg min-h-[400px]">
						<EditorContent editor={editor} />
					</div>
				</CardContent>
			</Card>
		</>
	);
}
