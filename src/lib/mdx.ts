import rehypePrettyCode from "rehype-pretty-code";
import type { Options } from "rehype-pretty-code";
import type { CompileOptions } from "@mdx-js/mdx";

const prettyCodeOptions: Options = {
	theme: "github-dark",
};

export const mdxOptions: CompileOptions = {
	rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
};
