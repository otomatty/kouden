import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";

export const mdxOptions: MDXRemoteProps["options"] = {
	mdxOptions: {
		remarkPlugins: [
			// GitHub Flavored Markdown support
			remarkGfm,
		],
		rehypePlugins: [
			// Add ids to headings
			rehypeSlug,
			// Add links to headings
			[
				rehypeAutolinkHeadings,
				{
					behavior: "wrap",
					properties: {
						className: ["anchor"],
					},
				},
			],
			// Syntax highlighting
			rehypeHighlight,
		],
	},
};
