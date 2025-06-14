import { Suspense } from "react";
import type { Metadata } from "next";
import { ReturnItemsPageClient } from "./ReturnItemsPageClient";
import { TableSkeleton } from "@/components/custom/loading/skeletons";

export const metadata: Metadata = {
	title: "返礼品管理",
	description: "香典返しで使用する返礼品の管理",
};

interface ReturnItemsPageProps {
	params: Promise<{
		id: string;
	}>;
}

/**
 * 返礼品管理ページ
 * 役割：香典帳に紐づく返礼品の管理機能を提供
 */
export default async function ReturnItemsPage({ params }: ReturnItemsPageProps) {
	const { id: koudenId } = await params;

	return (
		<div className="container mx-auto py-6">
			{/* メインコンテンツ */}
			<Suspense fallback={<TableSkeleton />}>
				<ReturnItemsPageClient koudenId={koudenId} />
			</Suspense>
		</div>
	);
}
