import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
	return (
		<section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background">
			<div className="container px-4 md:px-6 mx-auto">
				<div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
					<div className="flex flex-col justify-center space-y-4">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
								香典帳をデジタルで
								<br />
								スマートに管理
							</h1>
							<p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
								香典帳の記帳から返礼品の管理まで、すべてをデジタルで一元管理。
								あなたの大切な時間を効率的に使えます。
							</p>
						</div>
						<div className="flex flex-col gap-2 min-[400px]:flex-row">
							<Link href="/login">
								<Button size="lg" className="w-full min-[400px]:w-auto">
									無料で始める
								</Button>
							</Link>
							<Link href="#features">
								<Button
									size="lg"
									variant="outline"
									className="w-full min-[400px]:w-auto"
								>
									機能を見る
								</Button>
							</Link>
						</div>
					</div>
					<div className="flex items-center justify-center">
						<div className="relative aspect-square w-full">
							<Image
								src="/hero-image.png"
								alt="香典帳アプリのイメージ"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
