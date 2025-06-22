"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { extractHeaders, generateHeaderId, getUniqueHeaderId } from "@/utils/markdown-utils";
import { COMMON_PROSE_CLASSES, BlogContentStyles } from "@/components/blog/blog-content-styles";

interface MarkdownContentProps {
	content: string;
}

/**
 * Markdownコンテンツを表示するコンポーネント
 * GitHub Flavored Markdownとシンタックスハイライトに対応
 * 共通スタイル設定を使用して統一されたデザインを提供
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
		<div className={COMMON_PROSE_CLASSES}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight, rehypeRaw]}
				components={{
					// 共通スタイルコンポーネントを使用
					h1: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h1 id={id}>{children}</BlogContentStyles.h1>;
					},
					h2: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h2 id={id}>{children}</BlogContentStyles.h2>;
					},
					h3: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h3 id={id}>{children}</BlogContentStyles.h3>;
					},
					h4: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h4 id={id}>{children}</BlogContentStyles.h4>;
					},
					h5: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h5 id={id}>{children}</BlogContentStyles.h5>;
					},
					h6: ({ children }) => {
						const text = typeof children === "string" ? children : children?.toString() || "";
						const id = headerIdMap.get(text) || generateHeaderId(text);
						return <BlogContentStyles.h6 id={id}>{children}</BlogContentStyles.h6>;
					},
					code: ({ className, children }) => {
						return (
							<BlogContentStyles.code className={className}>{children}</BlogContentStyles.code>
						);
					},
					pre: ({ children }) => <BlogContentStyles.pre>{children}</BlogContentStyles.pre>,
					blockquote: ({ children }) => (
						<BlogContentStyles.blockquote>{children}</BlogContentStyles.blockquote>
					),
					table: ({ children }) => <BlogContentStyles.table>{children}</BlogContentStyles.table>,
					th: ({ children }) => <BlogContentStyles.th>{children}</BlogContentStyles.th>,
					td: ({ children }) => <BlogContentStyles.td>{children}</BlogContentStyles.td>,
					ul: ({ children }) => <BlogContentStyles.ul>{children}</BlogContentStyles.ul>,
					ol: ({ children }) => <BlogContentStyles.ol>{children}</BlogContentStyles.ol>,
					li: ({ children }) => <BlogContentStyles.li>{children}</BlogContentStyles.li>,
					p: ({ children }) => <BlogContentStyles.p>{children}</BlogContentStyles.p>,
					a: ({ children, href }) => (
						<BlogContentStyles.a href={href}>{children}</BlogContentStyles.a>
					),
					img: ({ src, alt }) => <BlogContentStyles.img src={src || ""} alt={alt || ""} />,
					hr: () => <BlogContentStyles.hr />,
					strong: ({ children }) => <BlogContentStyles.strong>{children}</BlogContentStyles.strong>,
					em: ({ children }) => <BlogContentStyles.em>{children}</BlogContentStyles.em>,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
