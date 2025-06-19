import { getAllDocs } from "@/lib/docs";
import { DocsContent } from "./_components/docs-content";
import { BreadcrumbNav } from "./_components/breadcrumb-nav";

export default async function DocsPage() {
	const docs = await getAllDocs();

	return (
		<>
			<BreadcrumbNav />
			<DocsContent docs={docs} />
		</>
	);
}
