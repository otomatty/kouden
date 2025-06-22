import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	Bug,
	Plus,
	Shield,
	Sparkles,
	Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChangelogMeta } from "@/lib/changelogs";

interface ChangelogItemProps {
	changelog: ChangelogMeta;
}

export function ChangelogItem({ changelog }: ChangelogItemProps) {
	// バージョンタイプ別の設定
	const typeConfig = {
		major: {
			color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
			icon: AlertCircle,
			label: "メジャー",
			cardBorder: "border-red-200 hover:border-red-300",
		},
		minor: {
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
			icon: Plus,
			label: "マイナー",
			cardBorder: "border-blue-200 hover:border-blue-300",
		},
		patch: {
			color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			icon: Bug,
			label: "パッチ",
			cardBorder: "border-green-200 hover:border-green-300",
		},
	};

	// カテゴリ別の設定
	const categoryConfig = {
		feature: {
			color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
			icon: Sparkles,
			label: "新機能",
		},
		bugfix: {
			color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
			icon: Bug,
			label: "バグ修正",
		},
		security: {
			color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
			icon: Shield,
			label: "セキュリティ",
		},
		performance: {
			color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			icon: Zap,
			label: "パフォーマンス",
		},
	};

	const TypeIcon = typeConfig[changelog.type].icon;
	const CategoryIcon = categoryConfig[changelog.category].icon;

	// 日付のフォーマット
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// バージョンスラッグの生成（v1.2.0 → v1-2-0）
	const versionSlug = changelog.version.replace(/\./g, "-");

	return (
		<Link href={`/changelogs/${versionSlug}`} className="block group">
			<Card
				className={cn(
					"hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]",
					typeConfig[changelog.type].cardBorder,
				)}
			>
				<CardHeader>
					<div className="flex items-center justify-between mb-3">
						{/* バッジ群 */}
						<div className="flex items-center space-x-2">
							<Badge className={typeConfig[changelog.type].color}>
								<TypeIcon className="w-3 h-3 mr-1" />
								{typeConfig[changelog.type].label}
							</Badge>
							<Badge variant="outline" className={categoryConfig[changelog.category].color}>
								<CategoryIcon className="w-3 h-3 mr-1" />
								{categoryConfig[changelog.category].label}
							</Badge>
							{changelog.breaking && (
								<Badge variant="destructive">
									<AlertTriangle className="w-3 h-3 mr-1" />
									破壊的変更
								</Badge>
							)}
						</div>

						{/* リリース日 */}
						<time className="text-sm text-muted-foreground font-medium">
							{formatDate(changelog.releaseDate)}
						</time>
					</div>

					{/* バージョンとタイトル */}
					<div className="flex items-baseline gap-3 mb-2">
						<div className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">
							v{changelog.version}
						</div>
						<CardTitle className="text-xl group-hover:text-primary transition-colors">
							{changelog.title}
						</CardTitle>
					</div>

					<CardDescription className="text-sm leading-relaxed">
						{changelog.description}
					</CardDescription>
				</CardHeader>

				<CardContent>
					{/* ハイライト */}
					{changelog.highlights.length > 0 && (
						<div className="mb-4">
							<h4 className="font-medium mb-3 text-foreground">🎯 主な変更点</h4>
							<ul className="space-y-2">
								{changelog.highlights.slice(0, 4).map((highlight) => (
									<li key={highlight} className="text-sm text-muted-foreground flex items-start">
										<div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
										<span className="leading-relaxed">{highlight}</span>
									</li>
								))}
								{changelog.highlights.length > 4 && (
									<li className="text-sm text-muted-foreground flex items-start">
										<div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2 mr-3 flex-shrink-0" />
										<span>他 {changelog.highlights.length - 4} 件の変更</span>
									</li>
								)}
							</ul>
						</div>
					)}

					{/* フッター */}
					<div className="pt-3 border-t border-border/50 flex items-center justify-between">
						<div className="text-xs text-muted-foreground">📦 {changelog.version} リリース</div>
						<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
