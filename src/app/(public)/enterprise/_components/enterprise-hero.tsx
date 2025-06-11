"use client";

import React from "react";
import Link from "next/link";
import { zenOldMincho } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

/**
 * Heroセクション
 */
export function EnterpriseHero() {
	return (
		<Section bgClassName="bg-background" className="py-32">
			<div className="text-center">
				<h1 className={`text-4xl font-bold mb-4 ${zenOldMincho.className}`}>
					故人を偲ぶ大切な時間を、煩雑な作業で奪わないために。
				</h1>
				<p className="text-lg text-gray-600 mb-8">
					葬儀社様・ギフトショップ様へ。ご遺族の香典管理から始まる「感謝のつながり」を、アプリで支えませんか？
				</p>
				<div className="flex justify-center gap-4">
					<Button asChild variant="default">
						<Link href="#partner-programs">パートナーシップの詳細を見る</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="#contact-form">オンラインデモを予約する</Link>
					</Button>
				</div>
			</div>
		</Section>
	);
}
