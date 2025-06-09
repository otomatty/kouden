import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { zenOldMincho } from "@/app/fonts";

export function HeroSection() {
	return (
		<section className="relative min-h-[calc(100vh-100px)] py-16 md:py-0 flex items-center justify-center bg-gradient-to-b from-primary/10 to-background">
			<div className="container px-4 md:px-6 mx-auto">
				<div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_800px]">
					<div className="flex flex-col justify-center space-y-4">
						<div className="space-y-4">
							<h1
								className={`text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none ${zenOldMincho.className}`}
							>
								香典の記録から
								<br />
								香典返しまで
								<br />
								シンプルに管理
							</h1>
							<p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
								突然の出来事で戸惑う方も多い香典の管理。
								<br />
								どのように管理したら良いかに不安を感じていませんか？
							</p>
							<p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
								専用アプリで簡単・安心な香典管理を。
								<br />
								スマートフォンでもパソコンでも、いつでもどこでも記録できます。
							</p>
						</div>
						<div className="flex flex-col gap-2 min-[400px]:flex-row">
							<Link href="/auth/login">
								<Button size="lg" className="w-full min-[400px]:w-auto">
									まずは無料で始めてみる
								</Button>
							</Link>
							<Link href="/features">
								<Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
									詳しい機能を見る
								</Button>
							</Link>
						</div>
					</div>
					<div className="flex items-center justify-center">
						<div className="relative aspect-square w-full">
							<Image
								src="/images/kouden-sample.webp"
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
