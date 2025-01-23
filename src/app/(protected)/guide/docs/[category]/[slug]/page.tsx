import { getDocBySlug } from "@/lib/docs";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { mdxOptions } from "@/lib/mdx";

type PageParams = Promise<{
	category: string;
	slug: string;
}>;

export async function generateMetadata({
	params,
}: {
	params: PageParams;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const { meta } = await getDocBySlug(
		resolvedParams.category,
		resolvedParams.slug,
	);
	return {
		title: meta.title,
		description: meta.description,
	};
}

export default async function DocsPage({
	params,
}: {
	params: PageParams;
}) {
	const resolvedParams = await params;
	const { meta, content } = await getDocBySlug(
		resolvedParams.category,
		resolvedParams.slug,
	);

	return (
		<div className="container py-8">
			<article className="prose prose-slate dark:prose-invert mx-auto">
				<h1>{meta.title}</h1>
				<p className="text-muted-foreground">{meta.description}</p>
				<hr className="my-4" />
				<MDXRemote source={content} options={{ mdxOptions }} />
			</article>
		</div>
	);
}
