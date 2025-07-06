export interface QuickHelpItem {
	id: string;
	title: string;
	description: string;
	category: "basic" | "advanced" | "troubleshooting" | "manners";
	actionType: "guide" | "tool" | "external" | "modal";
	actionHref: string;
	actionLabel: string;
	keywords: string[];
	isPopular?: boolean;
	estimatedTime?: string;
	sourceType: "manual" | "blog" | "static";
	sourceId?: string; // マニュアルのslugやブログのid
	icon?: string; // アイコン名を文字列で保存
	priority?: number; // 表示優先度
	lastUpdated?: string;
	viewCount?: number;
	clickCount?: number;
}

export interface HelpCategory {
	value: string;
	label: string;
	icon: string;
	description?: string;
}

export interface HelpSearchResult {
	items: QuickHelpItem[];
	totalCount: number;
	categories: HelpCategory[];
}

export interface HelpSearchParams {
	query?: string;
	category?: string;
	limit?: number;
	offset?: number;
	sortBy?: "relevance" | "popularity" | "date" | "title";
	includePopular?: boolean;
}
