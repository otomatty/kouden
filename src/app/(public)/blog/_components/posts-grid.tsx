import { BlogPostCard } from "./blog-post-card";
import type { TPost } from "@/types/post";

interface PostsGridProps {
	posts: TPost[];
	title?: string;
}

/**
 * 記事一覧グリッドコンポーネント
 */
export function PostsGrid({ posts, title }: PostsGridProps) {
	if (!posts || posts.length === 0) {
		return (
			<section className="mb-12">
				{title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
				<p className="text-muted-foreground">記事がありません。</p>
			</section>
		);
	}

	return (
		<section className="mb-12">
			{title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<BlogPostCard key={post.id} post={post} />
				))}
			</div>
		</section>
	);
}
