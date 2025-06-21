import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/custom/back-link";
import { BookmarksList } from "./_components/bookmarks-list";
import { BookmarksFilters } from "./_components/bookmarks-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export const metadata: Metadata = {
	title: "ブックマーク一覧 | 香典帳",
	description: "ブックマークした記事の一覧ページです",
};

interface BookmarksPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * ブックマーク一覧ページのコンテンツコンポーネント
 */
async function BookmarksPageContent({
	searchParams,
}: { searchParams: { [key: string]: string | string[] | undefined } }) {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		redirect("/auth/login");
	}

	// URLパラメータの解析
	const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
	const sortBy = typeof searchParams.sort === "string" ? searchParams.sort : "bookmark_date_desc";
	const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

	return (
		<div className="container py-8">
			<BackLink href="/profile" label="プロフィールに戻る" />

			<div className="mt-8 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bookmark className="h-5 w-5" />
							ブックマーク一覧
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* フィルター・検索エリア */}
						<BookmarksFilters
							currentCategory={category}
							currentSort={sortBy}
							currentSearch={search}
						/>

						{/* ブックマーク一覧 */}
						<div className="mt-6">
							<BookmarksList category={category} sortBy={sortBy} search={search} />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
	const resolvedSearchParams = await searchParams;

	return (
		<Suspense>
			<BookmarksPageContent searchParams={resolvedSearchParams} />
		</Suspense>
	);
}
