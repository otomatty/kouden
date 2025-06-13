import { notFound } from "next/navigation";
import { getPostById } from "@/app/_actions/blog/posts";
import {
	getAccessibleOrganizations,
	getContextOrganizationId,
} from "@/app/_actions/blog/organizations";
import { BlogPostForm } from "@/components/blog/blog-post-form";

interface FuneralManagementEditBlogPostPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function FuneralManagementEditBlogPostPage({
	params,
}: FuneralManagementEditBlogPostPageProps) {
	const { id } = await params;
	const [
		{ data: post, error: postError },
		{ data: organizations, error: orgError },
		{ data: organizationId },
	] = await Promise.all([
		getPostById(id),
		getAccessibleOrganizations(),
		getContextOrganizationId("/funeral-management"),
	]);

	if (postError || !post) {
		notFound();
	}

	if (orgError || !organizations) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">記事を編集</h1>
				<p className="text-red-500">
					組織情報の取得に失敗しました: {orgError || "組織が見つかりません"}
				</p>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">記事を編集</h1>
			<BlogPostForm
				mode="organization"
				organizations={organizations}
				defaultOrganizationId={organizationId}
				basePath="/funeral-management"
				post={post}
			/>
		</div>
	);
}
