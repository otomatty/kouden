import { notFound } from "next/navigation";
import { getPostById } from "@/app/_actions/blog/posts";
import { getAccessibleOrganizations } from "@/app/_actions/blog/organizations";
import { BlogEditor } from "@/components/blog/blog-editor";

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
		<BlogEditor
			organizations={organizations}
			defaultOrganizationId={null}
			basePath="/admin"
			post={post}
			mode="admin"
		/>
	);
}
