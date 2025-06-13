import { notFound } from "next/navigation";
import { getPostById } from "@/app/_actions/blog/posts";
import { getAccessibleOrganizations } from "@/app/_actions/blog/organizations";
import { BlogPostForm } from "@/components/blog/blog-post-form";

interface AdminEditBlogPostPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function AdminEditBlogPostPage({ params }: AdminEditBlogPostPageProps) {
	const { id } = await params;
	const [{ data: post, error: postError }, { data: organizations }] = await Promise.all([
		getPostById(id),
		getAccessibleOrganizations(),
	]);

	if (postError || !post) {
		notFound();
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">記事を編集</h1>
			<BlogPostForm
				organizations={organizations}
				defaultOrganizationId={null}
				basePath="/admin"
				post={post}
				mode="admin"
			/>
		</div>
	);
}
