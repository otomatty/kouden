import Link from "next/link";
import { Button } from "@/components/ui/button";

const footerLinks = {
	product: [
		{ name: "料金", href: "/pricing" },
		{ name: "機能", href: "/features" },
		{ name: "使い方", href: "/guide" },
	],
	info: [
		{ name: "更新情報", href: "/updates" },
		{ name: "ブログ", href: "/blog" },
	],
	support: [
		{ name: "よくある質問", href: "/faq" },
		{ name: "お問い合わせ", href: "/contact" },
	],
	legal: [
		{ name: "利用規約", href: "/terms" },
		{ name: "プライバシーポリシー", href: "/privacy" },
		{ name: "特定商取引法に基づく表記", href: "/legal" },
	],
};

export function Footer() {
	return (
		<footer className="border-t bg-background">
			<div className="container px-4 md:px-6 py-8 mx-auto">
				<div className="grid grid-cols-2 md:grid-cols-5 gap-8">
					<div className="space-y-4 col-span-2 md:col-span-1">
						<h2 className="text-lg font-semibold">香典帳</h2>
						<p className="text-sm text-muted-foreground">
							香典や供物の記録、返礼品の管理をデジタルで簡単に。
						</p>
						<Button asChild size="sm">
							<Link href="/auth/login">利用を開始する</Link>
						</Button>
					</div>

					<div>
						<h3 className="font-semibold mb-4">サービス</h3>
						<ul className="space-y-3">
							{footerLinks.product.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="font-semibold mb-4">情報</h3>
						<ul className="space-y-3">
							{footerLinks.info.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="font-semibold mb-4">サポート</h3>
						<ul className="space-y-3">
							{footerLinks.support.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="font-semibold mb-4">法的情報</h3>
						<ul className="space-y-3">
							{footerLinks.legal.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
			<div className="py-8 border-t text-center text-sm text-muted-foreground">
				<p>
					© {new Date().getFullYear()} <Link href="https://saedgewell.net">Saedgewell</Link> All
					rights reserved.
				</p>
			</div>
		</footer>
	);
}
