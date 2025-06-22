"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * チャット用のMarkdownコンポーネント設定
 * コンパクトなスタイリングでチャットに最適化
 */
const ChatMarkdownComponents = {
	// 見出しはサイズを小さく調整
	h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h1 className="text-base font-bold mt-3 mb-2 first:mt-0" {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h2 className="text-base font-semibold mt-3 mb-2 first:mt-0" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props}>
			{children}
		</h3>
	),
	// 段落は余白を調整
	p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
		<p className="mb-2 leading-relaxed last:mb-0" {...props}>
			{children}
		</p>
	),
	// 太字・斜体
	strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
		<strong className="font-semibold" {...props}>
			{children}
		</strong>
	),
	em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
		<em className="italic" {...props}>
			{children}
		</em>
	),
	// インラインコード
	code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
		<code className="px-1 py-0.5 bg-muted/50 rounded text-xs font-mono" {...props}>
			{children}
		</code>
	),
	// コードブロック
	pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
		<pre className="bg-muted/50 rounded p-2 mt-2 mb-2 overflow-x-auto text-xs" {...props}>
			{children}
		</pre>
	),
	// リスト
	ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
		<ul className="list-disc list-inside my-2 space-y-1 pl-2" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
		<ol className="list-decimal list-inside my-2 space-y-1 pl-2" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
		<li className="text-sm" {...props}>
			{children}
		</li>
	),
	// 引用
	blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
		<blockquote
			className="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground"
			{...props}
		>
			{children}
		</blockquote>
	),
	// リンク
	a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a
			href={href}
			className="text-blue-600 underline hover:text-blue-800 transition-colors"
			target={href?.startsWith("http") ? "_blank" : undefined}
			rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
			{...props}
		>
			{children}
		</a>
	),
	// 水平線
	hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
		<hr className="my-3 border-muted-foreground/20" {...props} />
	),
};

interface ChatMessageContentProps {
	content: string;
}

/**
 * チャットメッセージ用のMarkdownレンダラーコンポーネント
 * AIエージェントのメッセージをMarkdown形式で表示する
 */
export function ChatMessageContent({ content }: ChatMessageContentProps) {
	return (
		<div className="text-sm">
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={ChatMarkdownComponents}>
				{content}
			</ReactMarkdown>
		</div>
	);
}
