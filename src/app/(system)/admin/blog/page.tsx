import { getOrganizationPosts } from "@/app/_actions/blog/posts";
import { BlogPostsTable } from "@/components/blog/blog-posts-table";

export default async function AdminBlogPage() {
	const { data: posts, error } = await getOrganizationPosts();

	if (error) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">ブログ記事管理</h1>
				<p className="text-red-500">記事の読み込み中にエラーが発生しました: {error}</p>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">ブログ記事管理</h1>
			<BlogPostsTable posts={posts || []} basePath="/admin" />
		</div>
	);
}
