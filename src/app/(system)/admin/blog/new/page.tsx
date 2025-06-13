import { getAccessibleOrganizations } from "@/app/_actions/blog/organizations";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export default async function AdminNewBlogPostPage() {
	const { data: organizations } = await getAccessibleOrganizations();

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">新しい記事を作成</h1>
			<BlogPostForm
				organizations={organizations}
				defaultOrganizationId={null}
				basePath="/admin"
				mode="admin"
			/>
		</div>
	);
}
