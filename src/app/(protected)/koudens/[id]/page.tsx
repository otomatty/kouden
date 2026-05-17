import { redirect, notFound } from "next/navigation";
import { getKouden } from "@/app/_actions/koudens";

export default async function KoudenPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;
	// 香典帳取得してアーカイブ判定
	const result = await getKouden(koudenId);
	if (!result.ok) {
		if (result.error.code === "NOT_FOUND") notFound();
		throw new Error(result.error.message);
	}
	const kouden = result.data;
	if (kouden.status === "archived") {
		redirect(`/koudens/${koudenId}/archived`);
	}
	// デフォルトでentriesタブにリダイレクト
	redirect(`/koudens/${koudenId}/entries`);
}
