"use client";

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	HelpCircle,
	Search,
	ArrowRight,
	ExternalLink,
	Gift,
	FileText,
	Users,
	Mail,
	CreditCard,
	BookOpen,
	Clock,
	Settings,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickHelpItem {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	category: "basic" | "advanced" | "troubleshooting" | "manners";
	actionType: "guide" | "tool" | "external" | "modal";
	actionHref: string;
	actionLabel: string;
	keywords: string[];
	isPopular?: boolean;
	estimatedTime?: string;
}

interface QuickHelpAreaProps {
	className?: string;
	showSearch?: boolean;
	maxItems?: number;
	categories?: string[];
}

/**
 * クイックヘルプエリア
 * よくある質問や困りごとに即座にアクセスできるセクション
 */
export const QuickHelpArea = memo(function QuickHelpArea({
	className = "",
	showSearch = true,
	maxItems = 8,
	categories = ["basic", "advanced", "troubleshooting", "manners"],
}: QuickHelpAreaProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [isExpanded, setIsExpanded] = useState(false);

	// ヘルプアイテムのデータ（実際の実装時はAPIから取得）
	const helpItems: QuickHelpItem[] = [
		{
			id: "create-kouden",
			title: "香典帳を作成する",
			description: "新しい香典帳の作成手順を3分で学習",
			icon: BookOpen,
			category: "basic",
			actionType: "guide",
			actionHref: "/manuals/getting-started/basic-usage",
			actionLabel: "手順を見る",
			keywords: ["作成", "新規", "はじめて", "スタート"],
			isPopular: true,
			estimatedTime: "3分",
		},
		{
			id: "return-gifts",
			title: "返礼品の選び方",
			description: "予算別おすすめ返礼品と選定ポイント",
			icon: Gift,
			category: "basic",
			actionType: "guide",
			actionHref: "/manuals/features/offering-management",
			actionLabel: "選び方ガイド",
			keywords: ["返礼品", "お返し", "選び方", "予算"],
			isPopular: true,
			estimatedTime: "5分",
		},
		{
			id: "thank-you-letter",
			title: "お礼状の書き方",
			description: "心のこもったお礼状の文例とマナー",
			icon: FileText,
			category: "manners",
			actionType: "external",
			actionHref: "/blog/oreijotext-kakikata",
			actionLabel: "文例を見る",
			keywords: ["お礼状", "文例", "書き方", "マナー"],
			isPopular: true,
			estimatedTime: "10分",
		},
		{
			id: "invite-members",
			title: "メンバーを招待する",
			description: "家族や親族を香典帳に招待する方法",
			icon: Users,
			category: "basic",
			actionType: "tool",
			actionHref: "/koudens/new?step=invite",
			actionLabel: "招待機能を使う",
			keywords: ["招待", "メンバー", "共有", "家族"],
			estimatedTime: "2分",
		},
		{
			id: "email-templates",
			title: "招待メールのマナー",
			description: "適切な招待メールの送り方とテンプレート",
			icon: Mail,
			category: "manners",
			actionType: "guide",
			actionHref: "/manuals/features/invitation-management",
			actionLabel: "テンプレート集",
			keywords: ["メール", "招待", "テンプレート", "マナー"],
			estimatedTime: "7分",
		},
		{
			id: "kouden-manners",
			title: "香典の相場とマナー",
			description: "関係性別の香典金額と基本的なマナー",
			icon: CreditCard,
			category: "manners",
			actionType: "external",
			actionHref: "/blog/kouden-souba-manner",
			actionLabel: "相場表を見る",
			keywords: ["香典", "相場", "金額", "マナー", "関係性"],
			isPopular: true,
			estimatedTime: "8分",
		},
		{
			id: "plan-upgrade",
			title: "プランをアップグレード",
			description: "より多くの機能を利用するための手順",
			icon: Settings,
			category: "advanced",
			actionType: "tool",
			actionHref: "/pricing",
			actionLabel: "プラン比較",
			keywords: ["プラン", "アップグレード", "機能", "料金"],
			estimatedTime: "5分",
		},
		{
			id: "data-export",
			title: "データをエクスポート",
			description: "香典帳データの書き出しと保存方法",
			icon: ExternalLink,
			category: "advanced",
			actionType: "guide",
			actionHref: "/manuals/advanced/data-export",
			actionLabel: "手順を確認",
			keywords: ["エクスポート", "データ", "保存", "バックアップ"],
			estimatedTime: "3分",
		},
		{
			id: "troubleshoot-invite",
			title: "招待メールが届かない",
			description: "招待メールの配信に関するトラブル解決",
			icon: HelpCircle,
			category: "troubleshooting",
			actionType: "guide",
			actionHref: "/manuals/troubleshooting/email-delivery",
			actionLabel: "解決方法",
			keywords: ["招待", "メール", "届かない", "トラブル"],
			estimatedTime: "5分",
		},
	];

	// カテゴリ定義
	const categoryOptions = [
		{ value: "all", label: "すべて", icon: HelpCircle },
		{ value: "basic", label: "基本操作", icon: BookOpen },
		{ value: "manners", label: "マナー", icon: FileText },
		{ value: "advanced", label: "応用機能", icon: Settings },
		{ value: "troubleshooting", label: "トラブル", icon: HelpCircle },
	];

	// フィルタリング処理
	const filteredItems = helpItems.filter((item) => {
		const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
		const matchesSearch =
			searchQuery === "" ||
			item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

		return matchesCategory && matchesSearch && categories.includes(item.category);
	});

	// 表示アイテム数の制御
	const displayItems = isExpanded ? filteredItems : filteredItems.slice(0, maxItems);

	const getActionIcon = (actionType: QuickHelpItem["actionType"]) => {
		switch (actionType) {
			case "external":
				return ExternalLink;
			case "tool":
				return Settings;
			case "modal":
				return HelpCircle;
			default:
				return ArrowRight;
		}
	};

	const getCategoryColor = (category: QuickHelpItem["category"]) => {
		switch (category) {
			case "basic":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "manners":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "advanced":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "troubleshooting":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<Card className={cn("", className)}>
			<CardHeader className="pb-4">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<HelpCircle className="h-5 w-5 text-primary" />
					クイックヘルプ
					<Badge variant="secondary" className="text-xs">
						よくある質問
					</Badge>
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					困ったときはここから。すぐに解決策を見つけられます。
				</p>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* 検索とフィルター */}
				{showSearch && (
					<div className="space-y-3">
						{/* 検索バー */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="ヘルプを検索..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* カテゴリフィルター */}
						<div className="flex flex-wrap gap-2">
							{categoryOptions.map((category) => (
								<Button
									key={category.value}
									variant={selectedCategory === category.value ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCategory(category.value)}
									className="h-8 text-xs"
								>
									<category.icon className="h-3 w-3 mr-1" />
									{category.label}
								</Button>
							))}
						</div>
					</div>
				)}

				{/* ヘルプアイテム一覧 */}
				<div className="space-y-3">
					{displayItems.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">該当するヘルプが見つかりませんでした</p>
						</div>
					) : (
						displayItems.map((item) => {
							const ActionIcon = getActionIcon(item.actionType);
							return (
								<Link
									key={item.id}
									href={item.actionHref}
									className="block group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-200"
								>
									<div className="flex items-start justify-between">
										<div className="flex items-start space-x-3 flex-1">
											<div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
												<item.icon className="h-4 w-4 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium text-sm group-hover:text-primary transition-colors">
														{item.title}
													</h4>
													{item.isPopular && (
														<Badge variant="secondary" className="text-xs">
															人気
														</Badge>
													)}
													<Badge className={cn("text-xs", getCategoryColor(item.category))}>
														{categoryOptions.find((c) => c.value === item.category)?.label}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
													{item.description}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Clock className="h-3 w-3" />
													<span>{item.estimatedTime}</span>
													<span>•</span>
													<span className="text-primary font-medium">{item.actionLabel}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center ml-3">
											<ActionIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
										</div>
									</div>
								</Link>
							);
						})
					)}
				</div>

				{/* 展開/折りたたみボタン */}
				{filteredItems.length > maxItems && (
					<div className="pt-2 border-t border-border">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsExpanded(!isExpanded)}
							className="w-full justify-center"
						>
							{isExpanded ? (
								<>
									<span>少なく表示</span>
									<ChevronUp className="h-4 w-4 ml-1" />
								</>
							) : (
								<>
									<span>さらに表示 ({filteredItems.length - maxItems}件)</span>
									<ChevronDown className="h-4 w-4 ml-1" />
								</>
							)}
						</Button>
					</div>
				)}

				{/* フッター */}
				<div className="pt-3 mt-3 border-t border-border">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>解決しない場合は</span>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/contact" className="flex items-center gap-1">
								<Mail className="h-3 w-3" />
								お問い合わせ
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
