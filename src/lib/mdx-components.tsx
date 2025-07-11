import type { MDXComponents } from "mdx/types";
import type React from "react";
import Image from "next/image";
import { generateHeaderId } from "@/utils/markdown-utils";
import { AccordionMDX } from "@/components/ui/accordion-mdx";
import { convertGyazoUrl, isGyazoUrl } from "@/utils/image-utils";

// ページごとのID管理用（ページ遷移時にリセット）
let currentPageUsedIds = new Set<string>();

// ページ遷移時のリセット用
if (typeof window !== "undefined") {
	// ページ遷移時にリセット
	const resetIds = () => {
		currentPageUsedIds = new Set<string>();
	};

	// popstateイベントでリセット
	window.addEventListener("popstate", resetIds);

	// ページロード時もリセット
	window.addEventListener("load", resetIds);
}

/**
 * 見出しコンポーネント
 */
const createHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
	const HeadingComponent = ({
		children,
		...props
	}: { children: React.ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => {
		const Tag = `h${level}` as React.ElementType;

		// テキストコンテンツを抽出
		const textContent = typeof children === "string" ? children : String(children);

		// ブログ機能と同じID生成ロジックを使用
		const baseId = generateHeaderId(textContent);
		let uniqueId = baseId;
		let counter = 1;

		// 重複回避
		while (currentPageUsedIds.has(uniqueId)) {
			uniqueId = `${baseId}-${counter}`;
			counter++;
		}
		currentPageUsedIds.add(uniqueId);

		return (
			<Tag
				id={uniqueId}
				className={`scroll-mt-20 ${
					level === 1
						? "text-3xl font-bold mb-8 mt-8"
						: level === 2
							? "text-2xl font-semibold mb-6 mt-8"
							: level === 3
								? "text-xl font-semibold mb-4 mt-6"
								: level === 4
									? "text-lg font-medium mb-4 mt-6"
									: "text-base font-medium mb-3 mt-4"
				}`}
				{...props}
			>
				{children}
			</Tag>
		);
	};

	HeadingComponent.displayName = `Heading${level}`;
	return HeadingComponent;
};

export const mdxComponents: MDXComponents = {
	h1: createHeading(1),
	h2: createHeading(2),
	h3: createHeading(3),
	h4: createHeading(4),
	h5: createHeading(5),
	h6: createHeading(6),
	// カスタムコンポーネント
	Accordion: AccordionMDX,
	// その他のカスタムコンポーネントも必要に応じて追加可能
	p: ({ children, ...props }) => (
		<p className="mb-6 leading-relaxed text-base" {...props}>
			{children}
		</p>
	),
	ul: ({ children, ...props }) => (
		<ul className="mb-6 ml-6 list-disc space-y-3" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol className="mb-6 ml-6 list-decimal space-y-3" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="leading-relaxed" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }) => (
		<blockquote
			className="border-l-4 border-muted-foreground/20 pl-6 my-6 italic text-muted-foreground"
			{...props}
		>
			{children}
		</blockquote>
	),
	hr: ({ ...props }) => <hr className="my-8 border-border" {...props} />,
	img: ({
		src,
		alt,
	}: { src?: string; alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>) => {
		if (!src) return null;

		// Gyazo URLを画像URLに変換
		const convertedSrc = convertGyazoUrl(src);

		return (
			<>
				<Image
					src={convertedSrc}
					alt={alt || ""}
					width={800}
					height={600}
					className="rounded-lg border border-border shadow-sm max-w-full h-auto my-6"
					unoptimized
				/>
			</>
		);
	},
	code: ({ children, ...props }) => (
		<code className="px-1.5 py-0.5 bg-muted rounded-md text-sm font-mono" {...props}>
			{children}
		</code>
	),
	pre: ({ children, ...props }) => (
		<pre className="p-4 bg-muted rounded-lg overflow-x-auto my-6" {...props}>
			{children}
		</pre>
	),
	table: ({ children, ...props }) => (
		<div className="my-6 overflow-x-auto rounded-lg border border-border shadow-sm">
			<table className="w-full border-collapse bg-background" {...props}>
				{children}
			</table>
		</div>
	),
	thead: ({ children, ...props }) => (
		<thead className="bg-muted/50" {...props}>
			{children}
		</thead>
	),
	tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
	tr: ({ children, ...props }) => (
		<tr className="border-b border-border hover:bg-muted/30 transition-colors" {...props}>
			{children}
		</tr>
	),
	th: ({ children, ...props }) => (
		<th
			className="px-4 py-3 text-left font-medium text-muted-foreground border-r border-border last:border-r-0"
			{...props}
		>
			{children}
		</th>
	),
	td: ({ children, ...props }) => (
		<td className="px-4 py-3 border-r border-border last:border-r-0 text-sm" {...props}>
			{children}
		</td>
	),
};
