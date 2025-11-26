import { getAllDocs } from "@/lib/docs";
import { BreadcrumbNav } from "./_components/breadcrumb-nav";
import { DocsContent } from "./_components/docs-content";

export default async function DocsPage() {
	const docs = await getAllDocs();

	return (
		<>
			<BreadcrumbNav />
			<DocsContent docs={docs} />
		</>
	);
}
