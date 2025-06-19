import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import type { Options } from "rehype-pretty-code";
import type { CompileOptions } from "@mdx-js/mdx";

const prettyCodeOptions: Options = {
	theme: "github-dark",
};

export const mdxOptions: CompileOptions = {
	remarkPlugins: [remarkGfm],
	rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
};
