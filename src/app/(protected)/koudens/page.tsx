import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { KoudenList } from "./_components/kouden-list";
import { CreateKoudenForm } from "./_components/create-kouden-form";
import { getKoudens } from "@/app/_actions/koudens";

export const metadata: Metadata = {
	title: "一覧 | 香典帳",
	description: "香典帳の一覧ページです",
};

/**
 * 香典帳一覧ページのスケルトンコンポーネント
 */
function KoudensPageSkeleton() {
	return (
		<div className="space-y-12">
			{/* ヘッダーのスケルトン */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-[150px]" />
				<Skeleton className="h-10 w-[120px]" />
			</div>

			{/* リストのスケルトン */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, () => (
					<div key={crypto.randomUUID()} className="rounded-lg border p-4">
						<div className="space-y-3">
							<Skeleton className="h-6 w-[200px]" />
							<Skeleton className="h-4 w-[150px]" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-[80%]" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

async function KoudensPageContent() {
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

	return (
		<div className="space-y-12">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">香典帳一覧</h2>
				<CreateKoudenForm />
			</div>

			<KoudenList koudens={koudens || []} />
		</div>
	);
}

export default function KoudensPage() {
	return (
		<Suspense fallback={<KoudensPageSkeleton />}>
			<KoudensPageContent />
		</Suspense>
	);
}
