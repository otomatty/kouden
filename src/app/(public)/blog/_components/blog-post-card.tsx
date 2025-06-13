import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TPost } from "@/types/post";

interface BlogPostCardProps {
	post: TPost;
	variant?: "default" | "featured" | "compact";
	className?: string;
}

/**
 * ブログ記事カードコンポーネント
 */
export function BlogPostCard({ post, variant = "default", className = "" }: BlogPostCardProps) {
	const cardClasses = {
		default: "hover:shadow-lg transition-shadow cursor-pointer",
		featured: "hover:shadow-xl transition-shadow cursor-pointer border-primary/20",
		compact: "hover:shadow-md transition-shadow cursor-pointer h-full",
	};

	const titleClasses = {
		default: "line-clamp-2",
		featured: "line-clamp-3 text-lg",
		compact: "line-clamp-2 text-base",
	};

	return (
		<Link href={`/blog/${post.slug}`}>
			<Card className={`${cardClasses[variant]} ${className}`}>
				<CardHeader className={variant === "compact" ? "pb-3" : ""}>
					<CardTitle className={titleClasses[variant]}>{post.title}</CardTitle>
					{post.excerpt && variant !== "compact" && (
						<p className="text-sm text-muted-foreground line-clamp-2 mt-2">{post.excerpt}</p>
					)}
					<div className="flex items-center gap-2 mt-2">
						{post.category && (
							<Badge variant="outline" className="text-xs">
								{post.category}
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className={variant === "compact" ? "pt-0" : ""}>
					<p className="text-sm text-muted-foreground">
						{post.published_at && new Date(post.published_at).toLocaleDateString("ja-JP")}
					</p>
				</CardContent>
			</Card>
		</Link>
	);
}
