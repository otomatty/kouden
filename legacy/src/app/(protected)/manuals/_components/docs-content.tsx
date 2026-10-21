"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, Play } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { DocMeta } from "@/lib/docs";
import { getCategoryName } from "@/lib/docs-config";
import { DocsSearch } from "./docs-search";
import { QuickStartGuide } from "./quick-start-guide";
import { GuidedTour } from "./guided-tour";

interface DocsContentProps {
	docs?: DocMeta[];
}

const categoryInfo = {
	"getting-started": {
		description: "香典帳アプリの基本的な使い方を学びます",
		icon: Sparkles,
		color: "bg-blue-500/10 text-blue-600",
	},
	faq: {
		description: "困ったときの解決方法を探します",
		icon: HelpCircle,
		color: "bg-orange-500/10 text-orange-600",
	},
};

export function DocsContent({ docs = [] }: DocsContentProps) {
	const [showQuickStart, setShowQuickStart] = useState(false);
	const [showTour, setShowTour] = useState(false);
	const [searchQuery] = useState("");

	// 初回訪問の判定
	useEffect(() => {
		const hasVisited = localStorage.getItem("manuals-visited");
		if (!hasVisited) {
			setShowQuickStart(true);
			localStorage.setItem("manuals-visited", "true");
		}
	}, []);

	// カテゴリ別にドキュメントをグループ化
	const categorizedDocs = docs.reduce<Record<string, DocMeta[]>>((acc, doc) => {
		if (!acc[doc.category]) {
			acc[doc.category] = [];
		}
		acc[doc.category]?.push(doc);
		return acc;
	}, {});

	return (
		<div className="max-w-4xl">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold mb-2">マニュアル</h1>
						<p className="text-muted-foreground">
							香典帳アプリの使い方やよくある質問について詳しく説明しています。
						</p>
					</div>
					<Button variant="outline" onClick={() => setShowTour(true)} className="gap-2 shrink-0">
						<Play className="w-4 h-4" />
						使い方を見る
					</Button>
				</div>
			</div>

			{/* クイックスタートガイド（初回訪問時） */}
			{showQuickStart && (
				<div className="mb-8">
					<QuickStartGuide onDismiss={() => setShowQuickStart(false)} />
				</div>
			)}

			{/* 検索機能 */}
			<div className="mb-8" data-tour="search">
				<DocsSearch docs={docs} initialQuery={searchQuery} />
			</div>

			{/* カテゴリ別クイックアクセス */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-tour="categories">
				{Object.entries(categoryInfo).map(([key, info]) => {
					const Icon = info.icon;
					const categoryDocs = categorizedDocs[key] || [];

					return (
						<Card key={key} className="transition-all hover:shadow-md">
							<CardHeader className="pb-3">
								<div
									className={`inline-flex w-8 h-8 items-center justify-center rounded-md ${info.color} mb-2`}
								>
									<Icon className="w-4 h-4" />
								</div>
								<CardTitle className="text-lg">{getCategoryName(key)}</CardTitle>
								<CardDescription>{info.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{categoryDocs.slice(0, 3).map((doc) => (
										<Link
											key={doc.slug}
											href={`/manuals/${key}/${doc.slug}`}
											className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											• {doc.title}
										</Link>
									))}
									{categoryDocs.length > 3 && (
										<p className="text-xs text-muted-foreground">
											他 {categoryDocs.length - 3} 件...
										</p>
									)}
								</div>
								<Badge variant="secondary" className="mt-3">
									{categoryDocs.length} 件のドキュメント
								</Badge>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* 最近のドキュメント（簡易版） */}
			{docs.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">すべてのドキュメント</CardTitle>
						<CardDescription>左側のメニューから詳細を確認できます</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{docs.map((doc) => (
								<Link
									key={`${doc.category}-${doc.slug}`}
									href={`/manuals/${doc.category}/${doc.slug}`}
									className="group block p-3 rounded-md border border-border hover:border-border/80 transition-all hover:shadow-sm"
								>
									<div className="font-medium text-sm group-hover:text-primary transition-colors">
										{doc.title}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										{getCategoryName(doc.category)}
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* ガイドツアー */}
			<GuidedTour
				isActive={showTour}
				onComplete={() => setShowTour(false)}
				onSkip={() => setShowTour(false)}
			/>
		</div>
	);
}
