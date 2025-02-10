import { redirect } from "next/navigation";

export default async function KoudenPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;
	// デフォルトでentriesタブにリダイレクト
	redirect(`/koudens/${koudenId}/entries`);
}
