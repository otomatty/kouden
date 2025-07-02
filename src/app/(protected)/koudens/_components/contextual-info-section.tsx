"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	BookOpen,
	Gift,
	TrendingUp,
	AlertCircle,
	Lightbulb,
	Users,
	FileText,
	Heart,
	ArrowRight,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/supabase";
import type { Post } from "@/schemas/posts";
import { RecentBookmarks } from "./recent-bookmarks";

// 拡張した香典帳型（既存の型定義を参考）
type Plan = Database["public"]["Tables"]["plans"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type KoudenWithPlan = Database["public"]["Tables"]["koudens"]["Row"] & {
	owner?: Profile;
	plan: Plan;
	expired: boolean;
	remainingDays?: number;
};

interface ContextualInfoSectionProps {
	koudens: KoudenWithPlan[];
	blogPosts: Post[];
	className?: string;
}

// コンテンツタイプの定義
type ContentType =
	| "getting-started"
	| "plan-renewal"
	| "return-management"
	| "seasonal-manners"
	| "advanced-tips";

interface InfoContent {
	type: ContentType;
	priority: number;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	variant: "default" | "warning" | "info" | "tip";
	actionLabel: string;
	actionHref: string;
	isExternal?: boolean;
	tips?: string[];
}

/**
 * コンテキスト型インフォメーションセクション
 * ユーザーの香典帳の状態に応じて最適な情報を表示
 */
export const ContextualInfoSection = memo(function ContextualInfoSection({
	koudens,
	blogPosts,
	className = "",
}: ContextualInfoSectionProps) {
	// コンテキストに応じたコンテンツを決定
	const contextualContent = useMemo((): InfoContent => {
		// 1. 香典帳がない場合 - はじめてガイド（最優先）
		if (koudens.length === 0) {
			return {
				type: "getting-started",
				priority: 1,
				title: "はじめての香典帳作成ガイド",
				description:
					"香典帳の作成から管理まで、基本的な使い方をステップバイステップでご案内します。",
				icon: BookOpen,
				variant: "info",
				actionLabel: "使い方マニュアルを見る",
				actionHref: "/manuals/getting-started/basic-usage",
				tips: ["香典帳作成は3分で完了", "招待メールで簡単に共有", "返礼品管理も自動化"],
			};
		}

		// 2. 期限切れプランがある場合 - プラン更新案内
		const expiredKoudens = koudens.filter((k) => k.expired);
		if (expiredKoudens.length > 0) {
			return {
				type: "plan-renewal",
				priority: 2,
				title: "プラン更新のご案内",
				description: `${expiredKoudens.length}件の香典帳が期限切れです。プランを更新して引き続きご利用ください。`,
				icon: AlertCircle,
				variant: "warning",
				actionLabel: "プランを更新する",
				actionHref: "/pricing",
				tips: ["データは安全に保管されています", "更新後すぐに機能が復活", "30日間の猶予期間あり"],
			};
		}

		// 3. アクティブな香典帳がある場合 - 返礼品管理のコツ
		const activeKoudens = koudens.filter((k) => k.status !== "archived");
		if (activeKoudens.length > 0) {
			return {
				type: "return-management",
				priority: 3,
				title: "返礼品管理のコツ",
				description: "効率的な返礼品選びから発送まで、管理業務を楽にするポイントをご紹介します。",
				icon: Gift,
				variant: "tip",
				actionLabel: "返礼品ガイドを見る",
				actionHref: "/manuals/features/offering-management",
				tips: ["一括発送で手間を削減", "予算に応じた商品選択", "お礼状テンプレート活用"],
			};
		}

		// 4. デフォルト - 季節のマナー情報
		const currentMonth = new Date().getMonth() + 1;
		const isMemorialSeason = [3, 4, 9, 10].includes(currentMonth);

		return {
			type: "seasonal-manners",
			priority: 4,
			title: isMemorialSeason ? "春・秋の法要シーズン対応" : "香典マナー豆知識",
			description: isMemorialSeason
				? "法要シーズンに知っておきたい香典マナーと準備のポイントをお伝えします。"
				: "いざという時に慌てないための、香典に関する基本的なマナーをご紹介します。",
			icon: isMemorialSeason ? Users : Heart,
			variant: "default",
			actionLabel: "マナーガイドを見る",
			actionHref: "/blog",
			isExternal: true,
			tips: ["地域による違いも解説", "実例を交えた具体的アドバイス", "よくある疑問をQ&A形式で"],
		};
	}, [koudens]);

	// 関連記事をコンテンツタイプに応じてフィルタリング
	const relevantPosts = useMemo(() => {
		const categoryMap: Record<ContentType, string[]> = {
			"getting-started": ["マナー", "基本"],
			"plan-renewal": ["プラン", "機能"],
			"return-management": ["返礼品", "お礼状"],
			"seasonal-manners": ["マナー"],
			"advanced-tips": ["応用", "効率化"],
		};

		const relevantCategories = categoryMap[contextualContent.type] || ["マナー"];

		// 実際のブログ記事データから関連記事を取得
		return blogPosts
			.filter(
				(post) =>
					post.category && relevantCategories.some((category) => post.category?.includes(category)),
			)
			.slice(0, 2)
			.map((post) => ({
				id: post.id,
				title: post.title,
				excerpt: post.excerpt || "",
				category: post.category || "未分類",
				href: `/blog/${post.slug}`,
				publishedAt: post.published_at || post.created_at,
			}));
	}, [contextualContent.type, blogPosts]);

	const getVariantStyles = (variant: InfoContent["variant"]) => {
		switch (variant) {
			case "warning":
				return "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950";
			case "info":
				return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
			case "tip":
				return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
			default:
				return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950";
		}
	};

	const getIconColor = (variant: InfoContent["variant"]) => {
		switch (variant) {
			case "warning":
				return "text-orange-600 dark:text-orange-400";
			case "info":
				return "text-blue-600 dark:text-blue-400";
			case "tip":
				return "text-green-600 dark:text-green-400";
			default:
				return "text-gray-600 dark:text-gray-400";
		}
	};

	return (
		<div data-tour="contextual-info-section" className={`space-y-4 sm:space-y-6 ${className}`}>
			{/* メインコンテンツカード */}
			<Card
				className={`${getVariantStyles(contextualContent.variant)} transition-all duration-200`}
			>
				<CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
					<div className="flex items-start space-x-2 sm:space-x-3">
						<div
							className={`p-1.5 sm:p-2 rounded-lg bg-background/50 flex-shrink-0 ${getIconColor(contextualContent.variant)}`}
						>
							<contextualContent.icon className="h-4 w-4 sm:h-5 sm:w-5" />
						</div>
						<div className="flex-1 min-w-0">
							<CardTitle className="text-base sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
								<span className="break-words">{contextualContent.title}</span>
								<Badge variant="outline" className="text-xs w-fit">
									おすすめ
								</Badge>
							</CardTitle>
							<p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed break-words">
								{contextualContent.description}
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
					{/* ポイント一覧 */}
					{contextualContent.tips && contextualContent.tips.length > 0 && (
						<ul className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							{contextualContent.tips.map((tip) => (
								<li key={tip} className="flex items-start space-x-2 text-xs sm:text-sm">
									<Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
									<span className="text-muted-foreground leading-relaxed break-words">{tip}</span>
								</li>
							))}
						</ul>
					)}

					{/* アクションボタン */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2">
						<Button
							asChild
							size="sm"
							className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
						>
							<Link href={contextualContent.actionHref}>
								<span className="truncate">{contextualContent.actionLabel}</span>
								{contextualContent.isExternal ? (
									<ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
								) : (
									<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
								)}
							</Link>
						</Button>

						{contextualContent.variant === "warning" && (
							<span className="text-xs text-muted-foreground text-center sm:text-right">
								🚨 対応をお急ぎください
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 関連記事セクション */}
			{relevantPosts.length > 0 && (
				<Card>
					<CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
							<FileText className="h-3 w-3 sm:h-4 sm:w-4" />
							こちらもチェック
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 sm:p-6 pt-0">
						<div className="space-y-2 sm:space-y-3">
							{relevantPosts.map((post) => (
								<Link
									key={post.id}
									href={post.href}
									className="block group p-2 sm:p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-200"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors break-words">
												{post.title}
											</h4>
											<p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
												{post.excerpt}
											</p>
										</div>
										<div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-2 sm:ml-3 flex-shrink-0">
											<Badge variant="secondary" className="text-xs">
												{post.category}
											</Badge>
											<ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
										</div>
									</div>
								</Link>
							))}
						</div>

						{/* 全記事リンク */}
						<div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-border">
							<Button
								variant="ghost"
								size="sm"
								asChild
								className="w-full justify-center text-xs sm:text-sm"
							>
								<Link href="/blog" className="flex items-center gap-2">
									<span>すべての記事を見る</span>
									<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 最近のブックマーク */}
			<RecentBookmarks className="lg:col-span-2" />
		</div>
	);
});
