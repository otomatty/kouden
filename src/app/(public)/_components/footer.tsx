import Link from "next/link";
import { Button } from "@/components/ui/button";

const footerLinks = {
	product: [
		{ name: "機能紹介", href: "/features" },
		{ name: "使い方", href: "/guide" },
		{ name: "活用事例", href: "/use-cases" },
		{ name: "料金プラン", href: "/pricing" },
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
			<div className="container px-4 md:px-6 py-12 mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="space-y-4">
						<h2 className="text-lg font-semibold">香典帳</h2>
						<p className="text-sm text-muted-foreground">
							香典や供物の記録、返礼品の管理をデジタルで簡単に。
						</p>
						<div className="flex space-x-4">
							<Button asChild variant="outline" size="sm">
								<Link href="/auth/login">ログイン</Link>
							</Button>
							<Button asChild size="sm">
								<Link href="/auth/signup">無料で始める</Link>
							</Button>
						</div>
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

				<div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
					<p>© {new Date().getFullYear()} 香典帳 All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
