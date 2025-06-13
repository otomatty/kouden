import { BlogPostCard } from "./blog-post-card";
import type { TPost } from "@/types/post";

interface FeaturedPostsSectionProps {
	posts: TPost[];
	title?: string;
}

/**
 * 注目記事セクションコンポーネント
 */
export function FeaturedPostsSection({ posts, title = "注目記事" }: FeaturedPostsSectionProps) {
	if (!posts || posts.length === 0) {
		return null;
	}

	const [featuredPost, ...subFeaturedPosts] = posts;

	if (!featuredPost) {
		return null;
	}

	return (
		<section className="mb-12">
			<h2 className="text-2xl font-bold mb-6">{title}</h2>
			<div className="grid gap-6 md:grid-cols-2">
				{/* メイン注目記事 */}
				<div className="md:row-span-2">
					<BlogPostCard post={featuredPost} variant="featured" />
				</div>

				{/* サブ注目記事 */}
				<div className="grid gap-4">
					{subFeaturedPosts.map((post) => (
						<BlogPostCard key={post.id} post={post} variant="compact" />
					))}
				</div>
			</div>
		</section>
	);
}
