import { getAllDocs } from "@/lib/docs";
import { DocsList } from "./_components/docs-list";
import { DocsContent } from "./_components/docs-content";

export default async function DocsPage() {
	const docs = await getAllDocs();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col md:flex-row gap-8">
				<aside className="w-full md:w-64 shrink-0">
					<DocsList docs={docs} />
				</aside>
				<main className="flex-1">
					<DocsContent />
				</main>
			</div>
		</div>
	);
}
