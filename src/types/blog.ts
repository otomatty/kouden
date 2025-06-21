/**
 * ブログ記事の統計情報
 */
export interface PostStats {
	view_count: number;
	bookmark_count: number;
	last_viewed_at?: string | null;
}

/**
 * 人気記事の情報（統計情報付き）
 */
export interface PopularPost {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	category?: string;
	published_at: string;
	view_count: number;
	bookmark_count: number;
	popularity_score: number;
}

/**
 * 関連記事の情報
 */
export interface RelatedPost {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	category?: string;
	tags?: string[];
	published_at: string;
	view_count: number;
	bookmark_count: number;
	tag_match_count?: number;
}

/**
 * ブックマーク情報
 */
export interface BookmarkInfo {
	id: string;
	created_at: string;
	post: {
		id: string;
		title: string;
		slug: string;
		excerpt?: string;
		category?: string;
		published_at: string;
		post_stats?: PostStats;
	};
}

/**
 * ブックマーク統計情報
 */
export interface BookmarkStats {
	total: number;
	byCategory: Record<string, number>;
}

/**
 * 記事閲覧記録
 */
export interface PostView {
	id: string;
	post_id: string;
	user_id?: string;
	ip_address?: string;
	user_agent?: string;
	viewed_at: string;
	session_id?: string;
}

/**
 * Server Action のレスポンス型
 */
export interface ActionResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * ブックマーク切り替えのレスポンス
 */
export interface ToggleBookmarkResponse {
	success: boolean;
	bookmarked?: boolean;
	error?: string;
}
