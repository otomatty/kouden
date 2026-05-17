import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { getKoudenForAdmin } from "@/app/_actions/koudens/read";
import { notFound, redirect, unstable_rethrow } from "next/navigation";

export default async function AdminKoudenPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: koudenId } = await params;

	try {
		// 管理者権限チェック
		await checkAdminPermission();

		// 香典帳取得（管理者用関数を使用）
		const result = await getKoudenForAdmin(koudenId);
		if (!result.ok) {
			if (result.error.code === "NOT_FOUND") {
				notFound();
			}
			throw new Error(result.error.message);
		}

		// 管理者の場合は、アーカイブされていても通常のentriesタブにリダイレクト
		// （管理者は全てのステータスの香典帳にアクセス可能）
		redirect(`/admin/koudens/${koudenId}/entries`);
	} catch (error) {
		// `redirect()` / `notFound()` 由来の制御フロー例外は再 throw して
		// Next.js に処理させる。これがないと管理者リダイレクトが
		// `/admin/users` へのフォールバックに置き換わってしまう。
		unstable_rethrow(error);

		console.error("Admin kouden page error:", error);
		redirect("/admin/users");
	}
}
