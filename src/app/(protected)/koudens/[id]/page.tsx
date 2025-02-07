import { redirect } from "next/navigation";

export default function KoudenPage({ params }: { params: { id: string } }) {
	// デフォルトでentriesタブにリダイレクト
	redirect(`/koudens/${params.id}/entries`);
}
