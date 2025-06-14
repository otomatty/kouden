import { Suspense } from "react";
import { notFound } from "next/navigation";
import { UserDetail } from "./_components/user-detail";
import { UserDetailSkeleton } from "./_components/user-detail-skeleton";
import { getUserDetail } from "@/app/_actions/admin/users";

interface UserDetailPageProps {
	params: Promise<{
		userId: string;
	}>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
	try {
		// ユーザー詳細情報を取得
		const { userId } = await params;
		const user = await getUserDetail(userId);

		return (
			<div className="container mx-auto px-4 py-8">
				<Suspense fallback={<UserDetailSkeleton />}>
					<UserDetail user={user} />
				</Suspense>
			</div>
		);
	} catch (error) {
		console.error("Error loading user detail:", error);
		notFound();
	}
}
