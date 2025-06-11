import { Header } from "./(public)/_components/header";
import { Footer } from "./(public)/_components/footer";
import { MobileBottomNavigation } from "./(public)/_components/mobile-bottom-navigation";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Version fetched from environment variable
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export default function NotFound() {
	return (
		<>
			<Header version={version} />
			<main className="mt-16 min-h-screen overflow-x-hidden">
				<div className="flex h-screen flex-col items-center justify-center space-y-4">
					<h2 className="text-2xl font-bold">ページが見つかりません</h2>
					<p className="text-muted-foreground">
						お探しのページは存在しないか、移動した可能性があります。
					</p>
					<Button className="flex items-center gap-2" asChild>
						<Link href="/">
							<ArrowLeft className="h-4 w-4" />
							<span>ホームに戻る</span>
						</Link>
					</Button>
				</div>
			</main>
			<Footer />
			<MobileBottomNavigation />
		</>
	);
}
