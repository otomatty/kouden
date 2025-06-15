import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { getAllKoudens, type AdminKoudenListItem } from "@/app/_actions/admin/users";
import AdminKoudensClient from "./_components/AdminKoudensClient";

/**
 * 管理者用香典帳一覧ページ
 */
export default async function AdminKoudensPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		search?: string;
		status?: "all" | "active" | "archived" | "inactive";
		sortBy?: "created_at" | "updated_at" | "title" | "entries_count";
		sortOrder?: "asc" | "desc";
	}>;
}) {
	// 管理者権限チェック
	await checkAdminPermission();

	const params = await searchParams;
	const page = params.page ? Number.parseInt(params.page, 10) : 1;
	const search = params.search || "";
	const status = params.status || "all";
	const sortBy = params.sortBy || "created_at";
	const sortOrder = params.sortOrder || "desc";

	// 香典帳一覧を取得
	let koudens: AdminKoudenListItem[];
	let total: number;
	let hasMore: boolean;
	try {
		const result = await getAllKoudens({
			page,
			search,
			status,
			sortBy,
			sortOrder,
			limit: 20,
		});
		koudens = result.koudens;
		total = result.total;
		hasMore = result.hasMore;

		console.log("Page received koudens:", {
			count: koudens.length,
			total,
			hasMore,
		});
	} catch (error) {
		console.error("Failed to fetch koudens in page:", error);
		// エラーが発生した場合は空の結果を返す
		koudens = [];
		total = 0;
		hasMore = false;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">香典帳管理</h1>
					<p className="text-muted-foreground">システム内の全ての香典帳を管理できます</p>
				</div>
			</div>

			<AdminKoudensClient
				koudens={koudens}
				total={total}
				hasMore={hasMore}
				currentPage={page}
				currentSearch={search}
				currentStatus={status}
				currentSortBy={sortBy}
				currentSortOrder={sortOrder}
			/>
		</div>
	);
}
