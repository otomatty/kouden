import { AlertCircle, AlertTriangle, Bug, Plus, Shield, Sparkles, Zap } from "lucide-react";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ChangelogNavigation } from "@/components/changelogs/changelog-navigation";
import { BackLink } from "@/components/custom/back-link";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import { getChangelogBySlug, getChangelogNavigation } from "@/lib/changelogs";
import { mdxOptions } from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";

type PageParams = Promise<{
	slug: string;
}>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
	const resolvedParams = await params;

	try {
		const { meta } = await getChangelogBySlug(resolvedParams.slug);
		return {
			title: `${meta.title} (v${meta.version}) - 更新履歴`,
			description: meta.description,
			openGraph: {
				title: `${meta.title} (v${meta.version})`,
				description: meta.description,
			},
		};
	} catch {
		return {
			title: "更新履歴が見つかりません",
			description: "指定された更新履歴が見つかりませんでした。",
		};
	}
}

export default async function ChangelogDetailPage({ params }: { params: PageParams }) {
	const resolvedParams = await params;

	try {
		const { meta, content } = await getChangelogBySlug(resolvedParams.slug);
		const { prev, next } = await getChangelogNavigation(resolvedParams.slug);

		// タイプ設定
		const typeConfig = {
			major: {
				color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
				icon: AlertCircle,
				label: "メジャーアップデート",
			},
			minor: {
				color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
				icon: Plus,
				label: "マイナーアップデート",
			},
			patch: {
				color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
				icon: Bug,
				label: "パッチリリース",
			},
		};

		// カテゴリ設定
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

		const TypeIcon = typeConfig[meta.type].icon;
		const CategoryIcon = categoryConfig[meta.category].icon;

		// 日付フォーマット
		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		};

		return (
			<Container className="py-8 md:py-12">
				{/* 戻るリンク */}
				<div className="mb-6">
					<BackLink href="/changelogs" label="更新履歴一覧に戻る" />
				</div>

				{/* ヘッダー情報 */}
				<div className="mb-8 p-6 rounded-lg bg-muted/30 border">
					<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
						{/* バッジ群 */}
						<div className="flex items-center gap-3 flex-wrap">
							<Badge className={typeConfig[meta.type].color}>
								<TypeIcon className="w-4 h-4 mr-1" />
								{typeConfig[meta.type].label}
							</Badge>
							<Badge variant="outline" className={categoryConfig[meta.category].color}>
								<CategoryIcon className="w-4 h-4 mr-1" />
								{categoryConfig[meta.category].label}
							</Badge>
							{meta.breaking && (
								<Badge variant="destructive">
									<AlertTriangle className="w-4 h-4 mr-1" />
									破壊的変更あり
								</Badge>
							)}
						</div>

						{/* リリース日 */}
						<div className="text-sm text-muted-foreground">
							リリース日: {formatDate(meta.releaseDate)}
						</div>
					</div>

					{/* バージョンとタイトル */}
					<div className="flex items-baseline gap-4 mb-3">
						<h1 className="text-4xl md:text-5xl font-bold text-primary">v{meta.version}</h1>
						<h2 className="text-2xl md:text-3xl font-bold text-foreground">{meta.title}</h2>
					</div>

					<p className="text-lg text-muted-foreground leading-relaxed mb-4">{meta.description}</p>

					{/* ハイライト */}
					{meta.highlights.length > 0 && (
						<div>
							<h3 className="font-semibold mb-3">🎯 主な変更点</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{meta.highlights.map((highlight) => (
									<div key={highlight} className="flex items-start text-sm">
										<div className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0" />
										<span className="leading-relaxed">{highlight}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 破壊的変更の警告 */}
					{meta.breaking && (
						<div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
							<div className="flex items-center gap-2 text-destructive font-medium mb-1">
								<AlertTriangle className="w-4 h-4" />
								破壊的変更について
							</div>
							<p className="text-sm text-muted-foreground">
								このバージョンには既存の機能に影響する変更が含まれています。
								アップデート前に詳細をご確認ください。
							</p>
						</div>
					)}
				</div>

				{/* MDXコンテンツ */}
				<article className="prose prose-slate dark:prose-invert max-w-none">
					{content && content.trim().length > 0 ? (
						<MDXRemote source={content} options={mdxOptions} components={mdxComponents} />
					) : (
						<div className="text-center py-12 text-muted-foreground">
							<div className="text-6xl mb-4">📝</div>
							<p className="text-lg">詳細な変更内容はまだ準備中です</p>
							<p className="text-sm">近日中に更新予定です。</p>
						</div>
					)}
				</article>

				{/* ナビゲーション */}
				<ChangelogNavigation prevChangelog={prev} nextChangelog={next} />
			</Container>
		);
	} catch {
		return (
			<Container className="py-8 md:py-12">
				<div className="text-center py-12">
					<div className="text-6xl mb-4">🔍</div>
					<h1 className="text-2xl font-bold mb-2">更新履歴が見つかりません</h1>
					<p className="text-muted-foreground mb-6">
						指定された更新履歴が存在しないか、削除された可能性があります。
					</p>
					<BackLink href="/changelogs" label="更新履歴一覧に戻る" />
				</div>
			</Container>
		);
	}
}
