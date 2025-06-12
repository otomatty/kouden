import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * ギフトショップ向けのページ一覧を表示するセクション
 */
export function PagesSection() {
	const pages = [
		{ label: "ダッシュボード", href: "/enterprise/gift-shop" },
		{ label: "顧客管理", href: "/enterprise/gift-shop/customers" },
		{ label: "ロイヤルティ管理", href: "/enterprise/gift-shop/loyalty" },
		{ label: "マーケティング管理", href: "/enterprise/gift-shop/marketing" },
		{ label: "ストア連携設定", href: "/enterprise/gift-shop/store-integration" },
		{ label: "注文管理", href: "/enterprise/gift-shop/orders" },
		{ label: "在庫管理", href: "/enterprise/gift-shop/inventory" },
		{ label: "レポート", href: "/enterprise/gift-shop/reports" },
		{ label: "サポート", href: "/enterprise/gift-shop/support" },
		{ label: "システム設定", href: "/enterprise/gift-shop/settings" },
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
