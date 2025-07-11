import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function AppFooter() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t bg-background/80 backdrop-blur-sm pb-16 md:pb-0">
			<div className="container mx-auto px-4 py-6">
				<div className="flex flex-col gap-4 text-center">
					{/* Links */}
					<div className="flex justify-center gap-6 text-sm text-muted-foreground flex-wrap">
						<Link href="/terms" className="hover:text-foreground transition-colors">
							利用規約
						</Link>
						<Separator orientation="vertical" className="h-4 hidden md:block" />
						<Link href="/privacy" className="hover:text-foreground transition-colors">
							プライバシーポリシー
						</Link>
						<Separator orientation="vertical" className="h-4 hidden md:block" />
						<Link href="/legal" className="hover:text-foreground transition-colors">
							特定商取引法
						</Link>
						<Separator orientation="vertical" className="h-4 hidden md:block" />
						<Link href="/contact" className="hover:text-foreground transition-colors">
							お問い合わせ
						</Link>
						<Separator orientation="vertical" className="h-4 hidden md:block" />
						<Link href="/developers" className="hover:text-foreground transition-colors">
							開発者情報
						</Link>
					</div>

					{/* Copyright */}
					<div className="text-sm text-muted-foreground">
						© {currentYear}{" "}
						<Link
							href="https://saedgewell.net"
							className="hover:text-foreground transition-colors"
							target="_blank"
							rel="noopener noreferrer"
						>
							Saedgewell
						</Link>
						. All rights reserved.
					</div>
				</div>
			</div>
		</footer>
	);
}
