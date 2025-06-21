import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/app/_actions/blog/posts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Container from "@/components/ui/container";
import { BlogNavigation } from "./_components/blog-navigation";
import { BlogHeader } from "./_components/blog-header";
import { MarkdownContent } from "./_components/markdown-content";
import { TableOfContents } from "./_components/table-of-contents";
import { PostEngagement } from "./_components/post-engagement";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ViewTracker } from "./_components/view-tracker";

interface BlogPostPageProps {
	params: Promise<{
		slug: string;
	}>;
}

/**
 * ブログ記事詳細ページ
 * Markdownコンテンツの表示と目次生成に対応
 * 閲覧数の自動追跡機能付き
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { slug } = await params;
	const { data: post, error } = await getPublishedPostBySlug(slug);

	if (error || !post) {
		notFound();
	}

	// コンテンツが空の場合の処理
	const hasContent = post.content && post.content.trim().length > 0;

	return (
		<Container className="py-8">
			{/* 閲覧数自動追跡 */}
			<ViewTracker postId={post.id} />

			{/* ナビゲーション */}
			<BlogNavigation />

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* メインコンテンツ */}
				<div className="lg:col-span-3">
					<Card>
						<CardHeader className="space-y-6">
							<BlogHeader
								title={post.title}
								category={post.category}
								publishedAt={post.published_at}
								authorId={post.author_id}
								organizationId={post.organization_id}
								excerpt={post.excerpt}
							/>
						</CardHeader>
						<CardContent>
							{hasContent ? (
								<>
									<MarkdownContent content={post.content || ""} />

									{/* エンゲージメント統計とブックマーク機能 */}
									<div className="mt-8 pt-6 border-t border-border">
										<PostEngagement postId={post.id} className="mb-4" />
									</div>
								</>
							) : (
								<div className="text-center py-12">
									<p className="text-muted-foreground text-lg">
										記事の内容がまだ準備されていません。
									</p>
									<p className="text-muted-foreground text-sm mt-2">しばらくお待ちください。</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* サイドバー - 目次と関連記事 */}
				{hasContent && (
					<div className="hidden lg:block lg:col-span-1 relative">
						<div className="sticky top-24 space-y-6">
							<TableOfContents content={post.content || ""} />

							{/* 関連記事 */}
							<RelatedPosts
								currentPostId={post.id}
								category={post.category ?? undefined}
								tags={post.tags ?? undefined}
								limit={5}
							/>
						</div>
					</div>
				)}
			</div>
		</Container>
	);
}
