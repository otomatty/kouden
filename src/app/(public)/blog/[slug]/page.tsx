import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedPostBySlug } from "@/app/_actions/blog/posts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

interface BlogPostPageProps {
	params: {
		slug: string;
	};
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { data: post, error } = await getPublishedPostBySlug(params.slug);

	if (error || !post) {
		notFound();
	}

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			<Link
				href="/blog"
				className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
			>
				<ChevronLeft className="h-4 w-4" />
				記事一覧に戻る
			</Link>

			<Card>
				<CardHeader className="space-y-4">
					<div className="flex items-center gap-2">
						{/* TODO: 組織名を表示する */}
						<Badge variant="secondary">{post.organization_id}</Badge>
					</div>
					<h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						{/* TODO: 投稿者名を表示する */}
						{post.author_id && <span>投稿者: {post.author_id}</span>}
						{post.published_at && (
							<span>{new Date(post.published_at).toLocaleDateString("ja-JP")}</span>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="prose prose-gray dark:prose-invert max-w-none">
						{post.content ? (
							<div className="whitespace-pre-wrap">{post.content}</div>
						) : (
							<p className="text-muted-foreground">記事の内容がありません。</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
