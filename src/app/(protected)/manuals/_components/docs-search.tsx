"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import Link from "next/link";
import type { DocMeta } from "@/lib/docs";
import { getCategoryName } from "@/lib/docs-config";

interface DocsSearchProps {
	docs: DocMeta[];
	initialQuery?: string;
}

// カテゴリ名は設定ファイルから取得するように変更

export function DocsSearch({ docs, initialQuery = "" }: DocsSearchProps) {
	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	// 外部からのクエリ更新に対応
	useEffect(() => {
		if (initialQuery !== searchQuery) {
			setSearchQuery(initialQuery);
		}
	}, [initialQuery, searchQuery]);

	// 検索結果のフィルタリング
	const filteredDocs = useMemo(() => {
		const hasQuery = searchQuery.trim();
		if (!hasQuery) {
			if (!selectedCategory) {
				return [];
			}
		}

		return docs.filter((doc) => {
			const matchesQuery =
				!hasQuery ||
				doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				doc.description.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesCategory = !selectedCategory || doc.category === selectedCategory;

			return matchesQuery && matchesCategory;
		});
	}, [docs, searchQuery, selectedCategory]);

	const categories = Array.from(new Set(docs.map((doc) => doc.category)));

	const clearSearch = () => {
		setSearchQuery("");
		setSelectedCategory("");
	};

	const hasActiveFilters = searchQuery.trim() || selectedCategory;

	return (
		<div className="space-y-4">
			{/* 検索入力 */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="ドキュメントを検索..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10 pr-10"
				/>
				{searchQuery && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSearchQuery("")}
						className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
					>
						<X className="w-4 h-4" />
					</Button>
				)}
			</div>

			{/* カテゴリフィルタ */}
			<div className="flex flex-wrap gap-2">
				{categories.map((category) => (
					<Button
						key={category}
						variant={selectedCategory === category ? "default" : "outline"}
						size="sm"
						onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
					>
						{getCategoryName(category)}
					</Button>
				))}
			</div>

			{/* アクティブフィルタのクリア */}
			{hasActiveFilters && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{filteredDocs.length} 件の結果</span>
					<Button variant="ghost" size="sm" onClick={clearSearch}>
						<X className="w-4 h-4 mr-1" />
						クリア
					</Button>
				</div>
			)}

			{/* 検索結果 */}
			{hasActiveFilters && (
				<div className="space-y-3">
					{filteredDocs.length > 0 ? (
						filteredDocs.map((doc) => (
							<Card key={`${doc.category}-${doc.slug}`} className="transition-all hover:shadow-sm">
								<CardContent className="p-4">
									<Link href={`/manuals/${doc.category}/${doc.slug}`} className="block group">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1">
												<h3 className="font-medium group-hover:text-primary transition-colors">
													{doc.title}
												</h3>
												<p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
											</div>
											<Badge variant="secondary">{getCategoryName(doc.category)}</Badge>
										</div>
									</Link>
								</CardContent>
							</Card>
						))
					) : (
						<Card>
							<CardContent className="p-6 text-center">
								<p className="text-muted-foreground">
									検索条件に一致するドキュメントが見つかりませんでした。
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}
