import { notFound } from "next/navigation";
import { getPostById, getCurrentUserOrganizationId } from "@/app/_actions/blog/posts";
import { BlogPostForm } from "@/components/blog/blog-post-form";

interface FuneralManagementEditBlogPostPageProps {
	params: {
		id: string;
	};
}

export default async function FuneralManagementEditBlogPostPage({
	params,
}: FuneralManagementEditBlogPostPageProps) {
	const [{ data: post, error: postError }, { data: organizationId, error: orgError }] =
		await Promise.all([getPostById(params.id), getCurrentUserOrganizationId()]);

	if (postError || !post) {
		notFound();
	}

	if (orgError || !organizationId) {
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
			<BlogPostForm organizationId={organizationId} basePath="/funeral-management" post={post} />
		</div>
	);
}
