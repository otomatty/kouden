"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { extractHeaders, generateHeaderId, getUniqueHeaderId } from "@/utils/markdown-utils";

interface MarkdownContentProps {
	content: string;
}

/**
 * Markdownコンテンツを表示するコンポーネント
 * GitHub Flavored Markdownとシンタックスハイライトに対応
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
	// ヘッダー情報を事前に抽出してIDマッピングを作成
	const headers = extractHeaders(content);
	const headerIdMap = new Map<string, string>();

	// テキストからIDへのマッピングを作成
	for (const header of headers) {
		headerIdMap.set(header.text, header.id);
	}

	return (
		<div className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight, rehypeRaw]}
				components={{
					// カスタムコンポーネントの設定
					h1: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return (
							<h1 id={id} className="text-3xl font-bold mt-8 mb-4 first:mt-0">
								{children}
							</h1>
						);
					},
					h2: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return (
							<h2 id={id} className="text-2xl font-semibold mt-6 mb-3 border-b border-border pb-2">
								{children}
							</h2>
						);
					},
					h3: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return (
							<h3 id={id} className="text-xl font-semibold mt-5 mb-2">
								{children}
							</h3>
						);
					},
					code: ({ className, children, ...props }) => {
						const match = /language-(\w+)/.exec(className || "");
						return match ? (
							<code className={className} {...props}>
								{children}
							</code>
						) : (
							<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
								{children}
							</code>
						);
					},
					pre: ({ children }) => (
						<pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
							{children}
						</blockquote>
					),
					table: ({ children }) => (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse border border-border">{children}</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border border-border bg-muted p-2 text-left font-semibold">
							{children}
						</th>
					),
					td: ({ children }) => <td className="border border-border p-2">{children}</td>,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
