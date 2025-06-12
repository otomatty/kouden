import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * 葬儀管理システム内のページ一覧を表示するセクション
 */
export function PagesSection() {
	const pages = [
		{ label: "ダッシュボード", href: "/enterprise/funeral-management" },
		{ label: "顧客管理", href: "/enterprise/funeral-management/customers" },
		{ label: "葬儀案件", href: "/enterprise/funeral-management/cases" },
		{ label: "参列者", href: "/enterprise/funeral-management/attendees" },
		{ label: "香典受付記録", href: "/enterprise/funeral-management/donations" },
		{ label: "顧客連絡管理", href: "/enterprise/funeral-management/contacts" },
		{ label: "見積管理", href: "/enterprise/funeral-management/quotes" },
		{ label: "請求管理", href: "/enterprise/funeral-management/invoices" },
		{ label: "資材管理", href: "/enterprise/funeral-management/materials" },
		{ label: "タスク管理", href: "/enterprise/funeral-management/tasks" },
		{ label: "オンライン予約管理", href: "/enterprise/funeral-management/reservations" },
		{ label: "レポート", href: "/enterprise/funeral-management/reports" },
		{ label: "ユーザー／権限管理", href: "/enterprise/funeral-management/users" },
		{ label: "システム設定", href: "/enterprise/funeral-management/settings" },
	];

	return (
		<Section className="py-16">
			<SectionTitle title="ページ一覧" subtitle="各機能ページへのリンク" className="mb-8" />
			<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{pages.map((page) => (
					<li key={page.href}>
						<Link
							href={page.href}
							className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-accent transition-colors"
						>
							<span className="font-medium">{page.label}</span>
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</Link>
					</li>
				))}
			</ul>
		</Section>
	);
}
