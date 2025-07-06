"use server";

import { getAllDocs } from "@/lib/docs";
import { getPublishedPosts } from "@/app/_actions/blog/posts";
import type { QuickHelpItem, HelpSearchResult, HelpSearchParams } from "@/types/help";

/**
 * 静的ヘルプアイテムの定義
 * アプリ固有の機能やツールへのリンク
 */
const staticHelpItems: QuickHelpItem[] = [
	{
		id: "create-kouden",
		title: "香典帳を作成する",
		description: "新しい香典帳の作成手順を3分で学習",
		category: "basic",
		actionType: "tool",
		actionHref: "/koudens/new",
		actionLabel: "作成を開始",
		keywords: ["作成", "新規", "はじめて", "スタート", "香典帳"],
		isPopular: true,
		estimatedTime: "3分",
		sourceType: "static",
		icon: "BookOpen",
		priority: 10,
	},
	{
		id: "invite-members",
		title: "メンバーを招待する",
		description: "家族や親族を香典帳に招待する方法",
		category: "basic",
		actionType: "tool",
		actionHref: "/koudens/new?step=invite",
		actionLabel: "招待機能を使う",
		keywords: ["招待", "メンバー", "共有", "家族", "親族"],
		estimatedTime: "2分",
		sourceType: "static",
		icon: "Users",
		priority: 8,
	},
	{
		id: "plan-upgrade",
		title: "プランをアップグレード",
		description: "より多くの機能を利用するための手順",
		category: "advanced",
		actionType: "tool",
		actionHref: "/pricing",
		actionLabel: "プラン比較",
		keywords: ["プラン", "アップグレード", "機能", "料金", "有料"],
		estimatedTime: "5分",
		sourceType: "static",
		icon: "Settings",
		priority: 5,
	},
];

/**
 * マニュアルからヘルプアイテムを生成
 */
async function getManualHelpItems(): Promise<QuickHelpItem[]> {
	try {
		const docs = await getAllDocs();

		return docs.map((doc): QuickHelpItem => {
			// カテゴリマッピング
			const categoryMap: Record<string, QuickHelpItem["category"]> = {
				"getting-started": "basic",
				"basic-operations": "basic",
				"kouden-entries": "basic",
				offerings: "basic",
				statistics: "advanced",
				advanced: "advanced",
				troubleshooting: "troubleshooting",
				faq: "troubleshooting",
				permissions: "advanced",
				"return-management": "advanced",
				telegrams: "basic",
			};

			// アイコンマッピング
			const iconMap: Record<string, string> = {
				"getting-started": "BookOpen",
				"basic-operations": "Play",
				"kouden-entries": "FileText",
				offerings: "Gift",
				statistics: "BarChart3",
				advanced: "Settings",
				troubleshooting: "HelpCircle",
				faq: "HelpCircle",
				permissions: "Shield",
				"return-management": "Box",
				telegrams: "Mail",
			};

			// 推定時間を計算（説明文の長さから）
			const estimatedMinutes = Math.max(2, Math.ceil(doc.description.length / 100));

			// キーワードを生成（タイトルと説明から）
			const keywords = [
				...doc.title.split(/\s+/),
				...doc.description.split(/\s+/),
				doc.category,
			].filter((word) => word.length > 1);

			return {
				id: `manual-${doc.category}-${doc.slug}`,
				title: doc.title,
				description: doc.description,
				category: categoryMap[doc.category] || "basic",
				actionType: "guide",
				actionHref: `/manuals/${doc.category}/${doc.slug}`,
				actionLabel: "マニュアルを見る",
				keywords,
				estimatedTime: `${estimatedMinutes}分`,
				sourceType: "manual",
				sourceId: `${doc.category}/${doc.slug}`,
				icon: iconMap[doc.category] || "FileText",
				priority: doc.categoryOrder + doc.docOrder,
			};
		});
	} catch (error) {
		console.error("Failed to load manual help items:", error);
		return [];
	}
}

/**
 * ブログ記事からヘルプアイテムを生成
 */
async function getBlogHelpItems(): Promise<QuickHelpItem[]> {
	try {
		const { data: posts } = await getPublishedPosts();
		if (!posts) return [];

		// 香典帳アプリに関連する記事のみを抽出
		const relevantPosts = posts.filter((post) => {
			const content = `${post.title} ${post.excerpt || ""} ${post.category || ""}`.toLowerCase();
			const relevantKeywords = [
				"香典",
				"お礼状",
				"返礼品",
				"マナー",
				"相場",
				"葬儀",
				"法要",
				"弔問",
				"供物",
				"電報",
			];
			return relevantKeywords.some((keyword) => content.includes(keyword));
		});

		return relevantPosts.map((post): QuickHelpItem => {
			// カテゴリマッピング（ブログのカテゴリから）
			const categoryMap: Record<string, QuickHelpItem["category"]> = {
				マナー: "manners",
				基本操作: "basic",
				応用機能: "advanced",
				トラブルシューティング: "troubleshooting",
			};

			// 推定読了時間を計算
			const contentLength = post.content?.length || 0;
			const estimatedMinutes = Math.max(3, Math.ceil(contentLength / 600)); // 1分間約600文字

			// キーワードを生成
			const keywords = [
				...post.title.split(/\s+/),
				...(post.excerpt || "").split(/\s+/),
				post.category || "",
			].filter((word) => word.length > 1);

			return {
				id: `blog-${post.id}`,
				title: post.title,
				description: post.excerpt || `${post.title}について詳しく解説します`,
				category: categoryMap[post.category || ""] || "manners",
				actionType: "external",
				actionHref: `/blog/${post.slug}`,
				actionLabel: "記事を読む",
				keywords,
				estimatedTime: `${estimatedMinutes}分`,
				sourceType: "blog",
				sourceId: post.id,
				icon: "ExternalLink",
				priority: 3,
				lastUpdated: post.updated_at,
			};
		});
	} catch (error) {
		console.error("Failed to load blog help items:", error);
		return [];
	}
}

/**
 * すべてのヘルプアイテムを取得
 */
export async function getAllHelpItems(): Promise<QuickHelpItem[]> {
	const [manualItems, blogItems] = await Promise.all([getManualHelpItems(), getBlogHelpItems()]);

	return [...staticHelpItems, ...manualItems, ...blogItems];
}

/**
 * ヘルプアイテムを検索
 */
export async function searchHelpItems(params: HelpSearchParams = {}): Promise<HelpSearchResult> {
	const {
		query = "",
		category = "all",
		limit = 8,
		offset = 0,
		sortBy = "relevance",
		includePopular = true,
	} = params;

	try {
		const allItems = await getAllHelpItems();

		// フィルタリング
		let filteredItems = allItems.filter((item) => {
			// カテゴリフィルター
			const matchesCategory = category === "all" || item.category === category;

			// 検索クエリフィルター
			const matchesQuery =
				!query ||
				item.title.toLowerCase().includes(query.toLowerCase()) ||
				item.description.toLowerCase().includes(query.toLowerCase()) ||
				item.keywords.some((keyword) => keyword.toLowerCase().includes(query.toLowerCase()));

			return matchesCategory && matchesQuery;
		});

		// ソート
		switch (sortBy) {
			case "popularity":
				filteredItems.sort((a, b) => {
					const aScore = (a.isPopular ? 10 : 0) + (a.clickCount || 0);
					const bScore = (b.isPopular ? 10 : 0) + (b.clickCount || 0);
					return bScore - aScore;
				});
				break;
			case "date":
				filteredItems.sort((a, b) => {
					const aDate = new Date(a.lastUpdated || "2024-01-01");
					const bDate = new Date(b.lastUpdated || "2024-01-01");
					return bDate.getTime() - aDate.getTime();
				});
				break;
			case "title":
				filteredItems.sort((a, b) => a.title.localeCompare(b.title, "ja"));
				break;
			default: // relevance
				filteredItems.sort((a, b) => {
					// 優先度とマッチ度を組み合わせたスコア
					const aScore = (a.priority || 0) + (a.isPopular ? 5 : 0);
					const bScore = (b.priority || 0) + (b.isPopular ? 5 : 0);
					return bScore - aScore;
				});
		}

		// 人気アイテムの優先表示
		if (includePopular && !query) {
			const popularItems = filteredItems.filter((item) => item.isPopular);
			const otherItems = filteredItems.filter((item) => !item.isPopular);
			filteredItems = [...popularItems, ...otherItems];
		}

		// ページネーション
		const paginatedItems = filteredItems.slice(offset, offset + limit);

		// カテゴリ一覧
		const categories = [
			{ value: "all", label: "すべて", icon: "HelpCircle" },
			{ value: "basic", label: "基本操作", icon: "BookOpen" },
			{ value: "manners", label: "マナー", icon: "FileText" },
			{ value: "advanced", label: "応用機能", icon: "Settings" },
			{ value: "troubleshooting", label: "トラブル", icon: "HelpCircle" },
		];

		return {
			items: paginatedItems,
			totalCount: filteredItems.length,
			categories,
		};
	} catch (error) {
		console.error("Failed to search help items:", error);
		return {
			items: [],
			totalCount: 0,
			categories: [],
		};
	}
}

/**
 * 人気のヘルプアイテムを取得
 */
export async function getPopularHelpItems(limit = 5): Promise<QuickHelpItem[]> {
	const result = await searchHelpItems({
		sortBy: "popularity",
		limit,
		includePopular: true,
	});

	return result.items;
}

/**
 * カテゴリ別のヘルプアイテムを取得
 */
export async function getHelpItemsByCategory(
	category: QuickHelpItem["category"],
	limit = 10,
): Promise<QuickHelpItem[]> {
	const result = await searchHelpItems({
		category,
		limit,
		sortBy: "relevance",
	});

	return result.items;
}
