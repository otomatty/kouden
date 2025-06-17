import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { KoudenList } from "./_components/kouden-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getKoudens } from "@/app/_actions/koudens";
import { InvitationSuccessAlert } from "./_components/invitation-success-alert";
import { HeroAnnouncements } from "./_components/hero-announcements";
import { getActiveAnnouncements } from "@/app/_actions/announcements";

export const metadata: Metadata = {
	title: "一覧 | 香典帳",
	description: "香典帳の一覧ページです",
};

interface KoudensPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 香典帳一覧ページのコンテンツコンポーネント
 */
async function KoudensPageContent({
	searchParams,
}: { searchParams: { [key: string]: string | string[] | undefined } }) {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error("認証が必要です");
	}

	const { koudens = [], error } = await getKoudens();

	if (error) {
		throw new Error(error);
	}

	// お知らせデータを取得
	const { announcements = [] } = await getActiveAnnouncements();

	const invitationStatus =
		typeof searchParams.invitation === "string" ? searchParams.invitation : undefined;

	return (
		<div className="space-y-4 md:space-y-8 mb-16">
			{/* ヒーローお知らせ表示 */}
			{announcements.length > 0 && <HeroAnnouncements announcements={announcements} />}

			{/* 招待成功時のアラート表示 */}
			{invitationStatus && <InvitationSuccessAlert status={invitationStatus} />}

			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">香典帳一覧</h2>
				<div className="flex items-center">
					{/* Mobile: default size, full label */}
					<Button asChild size="sm" className="flex items-center gap-2 md:hidden">
						<Link href="/koudens/new">
							<Plus className="h-4 w-4" />
							<span>香典帳を作成</span>
						</Link>
					</Button>
					{/* Desktop: small size, shortened label */}
					<Button asChild className="hidden items-center gap-2 md:flex">
						<Link href="/koudens/new">
							<Plus className="h-4 w-4" />
							<span>香典帳を作成する</span>
						</Link>
					</Button>
				</div>
			</div>

			<KoudenList koudens={koudens || []} />
		</div>
	);
}

export default async function KoudensPage({ searchParams }: KoudensPageProps) {
	const resolvedSearchParams = await searchParams;

	return (
		<Suspense>
			<KoudensPageContent searchParams={resolvedSearchParams} />
		</Suspense>
	);
}
