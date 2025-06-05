"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import KoudenHeader from "../../_components/_common/KoudenHeader";
import type { KoudenPermission } from "@/types/role";

interface ArchivedPageClientProps {
	id: string;
	title: string;
	description?: string | null;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
}

export default function ArchivedPageClient({
	id,
	title,
	description,
	permission,
	enableExcel,
}: ArchivedPageClientProps) {
	return (
		<>
			<KoudenHeader
				koudenId={id}
				title={title}
				description={description}
				fullAccess={false}
				permission={permission}
				enableExcel={enableExcel}
			/>
			<div className="flex flex-col items-center justify-center h-full p-8">
				<h1 className="text-2xl font-bold mb-4">閲覧期限が切れています</h1>
				<p className="text-gray-600 mb-6">
					この香典帳の無料閲覧期間は終了しました。プランを購入して続きをご覧ください。
				</p>
				<Button asChild>
					<a href={`/koudens/${id}/purchase`}>プランを購入する</a>
				</Button>
			</div>
		</>
	);
}
