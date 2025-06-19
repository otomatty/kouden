"use client";

import { getAllDocs } from "@/lib/docs";
import { DocsList } from "./docs-list";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { use } from "react";

interface ManualsLayoutProps {
	children: React.ReactNode;
	category?: string;
	docTitle?: string;
}

export function ManualsLayout({ children, category, docTitle }: ManualsLayoutProps) {
	// サーバーサイドで取得したドキュメント一覧を使用
	const docs = use(getAllDocs());

	return (
		<div className="container mx-auto px-4 py-8">
			<BreadcrumbNav category={category} docTitle={docTitle} />
			<div className="flex flex-col md:flex-row gap-8">
				<aside className="w-full md:w-64 shrink-0" data-tour="sidebar">
					<DocsList docs={docs} />
				</aside>
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
