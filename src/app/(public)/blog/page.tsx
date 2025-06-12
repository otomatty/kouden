import Link from "next/link";
import { getPublishedPosts } from "@/app/_actions/blog/posts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BlogPage() {
	const { data: posts, error } = await getPublishedPosts();

	if (error) {
		return (
			<div className="container mx-auto py-8">
				<h1 className="text-3xl font-bold mb-8">お知らせ</h1>
				<p className="text-red-500">記事の読み込み中にエラーが発生しました。</p>
			</div>
		);
	}

	if (!posts || posts.length === 0) {
		return (
			<div className="container mx-auto py-8">
				<h1 className="text-3xl font-bold mb-8">お知らせ</h1>
				<p>まだ記事がありません。</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-8">お知らせ</h1>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<Link href={`/blog/${post.slug}`} key={post.id}>
						<Card className="hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<CardTitle className="line-clamp-2">{post.title}</CardTitle>
								<div className="flex items-center gap-2">
									{/* TODO: 組織名を表示する */}
									<Badge variant="secondary">{post.organization_id}</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{post.published_at && new Date(post.published_at).toLocaleDateString("ja-JP")}
								</p>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
