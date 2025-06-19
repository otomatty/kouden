import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import Link from "next/link";
import type { DocMeta } from "@/lib/docs";
import { getCategoryName } from "@/lib/docs-config";

interface DocNavigationProps {
	prevDoc?: DocMeta | null;
	nextDoc?: DocMeta | null;
}

// カテゴリ名は設定ファイルから取得するように変更

export function DocNavigation({ prevDoc, nextDoc }: DocNavigationProps) {
	return (
		<div className="mt-12 space-y-6">
			{/* 前/次ナビゲーション */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* 前のページ */}
				{prevDoc ? (
					<Link href={`/manuals/${prevDoc.category}/${prevDoc.slug}`} className="block">
						<Card className="h-full transition-all hover:shadow-md hover:border-primary/20 group">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0">
										<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
											<ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
										</div>
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
											前のページ
										</p>
										<h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate">
											{prevDoc.title}
										</h3>
										<p className="text-xs text-muted-foreground mt-1">
											{getCategoryName(prevDoc.category)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				) : (
					<div />
				)}

				{/* 次のページ */}
				{nextDoc ? (
					<Link href={`/manuals/${nextDoc.category}/${nextDoc.slug}`} className="block">
						<Card className="h-full transition-all hover:shadow-md hover:border-primary/20 group">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="min-w-0 flex-1 text-right">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
											次のページ
										</p>
										<h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate">
											{nextDoc.title}
										</h3>
										<p className="text-xs text-muted-foreground mt-1">
											{getCategoryName(nextDoc.category)}
										</p>
									</div>
									<div className="flex-shrink-0">
										<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
											<ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				) : (
					<div />
				)}
			</div>

			{/* マニュアル一覧に戻る */}
			<div className="text-center pt-6 border-t border-border">
				<Link href="/manuals">
					<Button variant="outline" className="gap-2">
						<List className="w-4 h-4" />
						マニュアル一覧に戻る
					</Button>
				</Link>
			</div>
		</div>
	);
}
