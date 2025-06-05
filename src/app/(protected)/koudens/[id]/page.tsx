import { redirect, notFound } from "next/navigation";
import { getKouden } from "@/app/_actions/koudens";

export default async function KoudenPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;
	// 香典帳取得してアーカイブ判定
	const kouden = await getKouden(koudenId);
	if (!kouden) notFound();
	if (kouden.status === "archived") {
		redirect(`/koudens/${koudenId}/archived`);
	}
	// デフォルトでentriesタブにリダイレクト
	redirect(`/koudens/${koudenId}/entries`);
}
