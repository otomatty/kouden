import { redirect, notFound } from "next/navigation";
import { getKoudenForAdmin } from "@/app/_actions/koudens/read";
import { checkAdminPermission } from "@/app/_actions/admin/permissions";

export default async function AdminKoudenPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;

	try {
		// 管理者権限チェック
		await checkAdminPermission();

		// 香典帳取得（管理者用関数を使用）
		const kouden = await getKoudenForAdmin(koudenId);
		if (!kouden) {
			notFound();
		}

		// 管理者の場合は、アーカイブされていても通常のentriesタブにリダイレクト
		// （管理者は全てのステータスの香典帳にアクセス可能）
		redirect(`/admin/koudens/${koudenId}/entries`);
	} catch (error) {
		// エラーの種類を判定
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error; // リダイレクトエラーは再スロー
		}

		console.error("Admin kouden page error:", error);
		redirect("/admin/users");
	}
}
