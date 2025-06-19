import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { mdxOptions } from "@/lib/mdx";
import { BreadcrumbNav } from "../../_components/breadcrumb-nav";
import { TableOfContents } from "../../_components/table-of-contents";
import { DocNavigation } from "../../_components/doc-navigation";
import { extractTocFromMdx, normalizeToc } from "@/lib/toc";
import { mdxComponents } from "@/lib/mdx-components";

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
	const { meta } = await getDocBySlug(resolvedParams.category, resolvedParams.slug);
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
	const { meta, content } = await getDocBySlug(resolvedParams.category, resolvedParams.slug);

	// 全ドキュメントを取得して前/次ナビゲーション用の情報を準備
	const allDocs = await getAllDocs();
	const currentIndex = allDocs.findIndex(
		(doc) => doc.category === meta.category && doc.slug === meta.slug,
	);
	const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
	const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

	// 目次を抽出
	const rawToc = extractTocFromMdx(content);
	const toc = normalizeToc(rawToc);

	return (
		<>
			<BreadcrumbNav category={meta.category} docTitle={meta.title} />

			<div className="flex flex-col lg:flex-row gap-4 md:gap-8">
				{/* メインコンテンツ */}
				<article className="prose prose-slate dark:prose-invert flex-1 max-w-none bg-background p-4 lg:p-8 rounded-lg">
					<h1>{meta.title}</h1>
					<p className="text-muted-foreground">{meta.description}</p>
					<hr className="my-4" />
					<MDXRemote source={content} options={{ mdxOptions }} components={mdxComponents} />

					{/* 前/次ナビゲーション */}
					<DocNavigation prevDoc={prevDoc} nextDoc={nextDoc} />
				</article>

				{/* 目次（デスクトップのみ） */}
				{toc.length > 0 && (
					<aside className="hidden lg:block w-64 shrink-0">
						<TableOfContents toc={toc} />
					</aside>
				)}
			</div>
		</>
	);
}
