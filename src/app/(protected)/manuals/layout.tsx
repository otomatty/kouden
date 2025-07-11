import { getAllDocs } from "@/lib/docs";
import { DocsList } from "./_components/docs-list";

export default async function ManualsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const docs = await getAllDocs();

	return (
		<div className="flex flex-col md:flex-row gap-8">
			<aside className="w-full md:w-64 shrink-0">
				<DocsList docs={docs} />
			</aside>
			<main className="flex-1">{children}</main>
		</div>
	);
}
