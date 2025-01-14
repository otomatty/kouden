import Link from "next/link";
import { Button } from "@/components/ui/button";

const navigation = [
	{ name: "機能", href: "/features" },
	{ name: "使い方", href: "/guide" },
	{ name: "ユースケース", href: "/use-cases" },
];

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
			<div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto">
				<div className="flex items-center space-x-8">
					<Link href="/" className="flex items-center space-x-2">
						<span className="text-xl font-bold">香典帳</span>
					</Link>
					<nav className="hidden md:flex items-center space-x-6">
						{navigation.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
							>
								{item.name}
							</Link>
						))}
					</nav>
				</div>
				<Link href="/login">
					<Button variant="outline" size="sm">
						ログイン
					</Button>
				</Link>
			</div>
		</header>
	);
}
