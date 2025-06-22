import { getAccessibleOrganizations } from "@/app/_actions/blog/organizations";
import { BlogEditor } from "@/components/blog/blog-editor";

export default async function AdminNewBlogPostPage() {
	const { data: organizations } = await getAccessibleOrganizations();

	return (
		<BlogEditor
			organizations={organizations}
			defaultOrganizationId={null}
			basePath="/admin"
			mode="admin"
		/>
	);
}
