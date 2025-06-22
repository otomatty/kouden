"use client";

import type { ReactNode } from "react";

/**
 * ブログコンテンツの共通スタイル設定
 * MarkdownとWYSIWYGエディターで統一されたスタイルを提供
 */

// 共通のproseクラス
export const COMMON_PROSE_CLASSES =
	"prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20";

// 共通のスタイルコンポーネント
export const BlogContentStyles = {
	h1: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h1 id={id} className="text-3xl font-bold mt-8 mb-4 first:mt-0">
			{children}
		</h1>
	),
	h2: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h2 id={id} className="text-2xl font-semibold mt-6 mb-3 border-b border-border pb-2">
			{children}
		</h2>
	),
	h3: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h3 id={id} className="text-xl font-semibold mt-5 mb-2">
			{children}
		</h3>
	),
	h4: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h4 id={id} className="text-lg font-semibold mt-4 mb-2">
			{children}
		</h4>
	),
	h5: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h5 id={id} className="text-base font-semibold mt-3 mb-2">
			{children}
		</h5>
	),
	h6: ({ children, id }: { children: ReactNode; id?: string }) => (
		<h6 id={id} className="text-sm font-semibold mt-3 mb-2">
			{children}
		</h6>
	),
	code: ({ className, children }: { className?: string; children: ReactNode }) => {
		const match = /language-(\w+)/.exec(className || "");
		return match ? (
			<code className={className}>{children}</code>
		) : (
			<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
		);
	},
	pre: ({ children }: { children: ReactNode }) => (
		<pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>
	),
	blockquote: ({ children }: { children: ReactNode }) => (
		<blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
			{children}
		</blockquote>
	),
	table: ({ children }: { children: ReactNode }) => (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse border border-border">{children}</table>
		</div>
	),
	th: ({ children }: { children: ReactNode }) => (
		<th className="border border-border bg-muted p-2 text-left font-semibold">{children}</th>
	),
	td: ({ children }: { children: ReactNode }) => (
		<td className="border border-border p-2">{children}</td>
	),
	ul: ({ children }: { children: ReactNode }) => (
		<ul className="list-disc list-inside my-4 space-y-1">{children}</ul>
	),
	ol: ({ children }: { children: ReactNode }) => (
		<ol className="list-decimal list-inside my-4 space-y-1">{children}</ol>
	),
	li: ({ children }: { children: ReactNode }) => <li className="text-foreground">{children}</li>,
	p: ({ children }: { children: ReactNode }) => (
		<p className="mb-4 text-foreground leading-relaxed">{children}</p>
	),
	a: ({ children, href }: { children: ReactNode; href?: string }) => (
		<a
			href={href}
			className="text-blue-600 underline hover:text-blue-800 transition-colors"
			target={href?.startsWith("http") ? "_blank" : undefined}
			rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
		>
			{children}
		</a>
	),
	img: ({ src, alt }: { src?: string | Blob; alt?: string }) => (
		<img
			src={typeof src === "string" ? src : undefined}
			alt={alt}
			className="max-w-full h-auto rounded-lg my-4 shadow-sm"
		/>
	),
	hr: () => <hr className="my-8 border-border" />,
	strong: ({ children }: { children: ReactNode }) => (
		<strong className="font-semibold text-foreground">{children}</strong>
	),
	em: ({ children }: { children: ReactNode }) => (
		<em className="italic text-foreground">{children}</em>
	),
};

/**
 * TipTap用のCSS設定
 * WYSIWYGエディター内でのスタイル適用
 */
export const TIPTAP_EDITOR_STYLES = `
.ProseMirror {
	outline: none;
	padding: 1rem;
	min-height: 400px;
}

.ProseMirror h1 {
	font-size: 1.875rem;
	font-weight: 700;
	margin-top: 2rem;
	margin-bottom: 1rem;
	color: rgb(var(--foreground));
}

.ProseMirror h1:first-child {
	margin-top: 0;
}

.ProseMirror h2 {
	font-size: 1.5rem;
	font-weight: 600;
	margin-top: 1.5rem;
	margin-bottom: 0.75rem;
	border-bottom: 1px solid rgb(var(--border));
	padding-bottom: 0.5rem;
	color: rgb(var(--foreground));
}

.ProseMirror h3 {
	font-size: 1.25rem;
	font-weight: 600;
	margin-top: 1.25rem;
	margin-bottom: 0.5rem;
	color: rgb(var(--foreground));
}

.ProseMirror h4 {
	font-size: 1.125rem;
	font-weight: 600;
	margin-top: 1rem;
	margin-bottom: 0.5rem;
	color: rgb(var(--foreground));
}

.ProseMirror h5 {
	font-size: 1rem;
	font-weight: 600;
	margin-top: 0.75rem;
	margin-bottom: 0.5rem;
	color: rgb(var(--foreground));
}

.ProseMirror h6 {
	font-size: 0.875rem;
	font-weight: 600;
	margin-top: 0.75rem;
	margin-bottom: 0.5rem;
	color: rgb(var(--foreground));
}

.ProseMirror p {
	margin-bottom: 1rem;
	line-height: 1.6;
	color: rgb(var(--foreground));
}

.ProseMirror ul {
	list-style-type: disc;
	list-style-position: inside;
	margin: 1rem 0;
	padding-left: 1rem;
}

.ProseMirror ol {
	list-style-type: decimal;
	list-style-position: inside;
	margin: 1rem 0;
	padding-left: 1rem;
}

.ProseMirror li {
	margin-bottom: 0.25rem;
	color: rgb(var(--foreground));
}

.ProseMirror li p {
	margin-bottom: 0;
	display: inline;
}

.ProseMirror blockquote {
	border-left: 4px solid rgb(var(--primary));
	padding-left: 1rem;
	font-style: italic;
	color: rgb(var(--muted-foreground));
	margin: 1rem 0;
}

.ProseMirror code {
	background-color: rgb(var(--muted));
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.ProseMirror pre {
	background-color: rgb(var(--muted));
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	margin: 1rem 0;
}

.ProseMirror pre code {
	background-color: transparent;
	padding: 0;
}

.ProseMirror table {
	width: 100%;
	border-collapse: collapse;
	border: 1px solid rgb(var(--border));
	margin: 1rem 0;
}

.ProseMirror th,
.ProseMirror td {
	border: 1px solid rgb(var(--border));
	padding: 0.5rem;
	text-align: left;
}

.ProseMirror th {
	background-color: rgb(var(--muted));
	font-weight: 600;
}

.ProseMirror a {
	color: #2563eb;
	text-decoration: underline;
}

.ProseMirror a:hover {
	color: #1d4ed8;
}

.ProseMirror img {
	max-width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 1rem 0;
	box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.ProseMirror hr {
	margin: 2rem 0;
	border: none;
	border-top: 1px solid rgb(var(--border));
}

.ProseMirror strong {
	font-weight: 600;
	color: rgb(var(--foreground));
}

.ProseMirror em {
	font-style: italic;
	color: rgb(var(--foreground));
}
`;
