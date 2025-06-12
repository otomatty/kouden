import { getCurrentUserOrganizationId } from "@/app/_actions/blog/posts";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export default async function AdminNewBlogPostPage() {
	const { data: organizationId, error } = await getCurrentUserOrganizationId();

	if (error || !organizationId) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">新しい記事を作成</h1>
				<p className="text-red-500">
					組織情報の取得に失敗しました: {error || "組織が見つかりません"}
				</p>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">新しい記事を作成</h1>
			<BlogPostForm organizationId={organizationId} basePath="/admin" />
		</div>
	);
}
