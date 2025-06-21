import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface BlogHeaderProps {
	title: string;
	category?: string | null;
	publishedAt?: string | null;
	authorId?: string | null;
	organizationId?: string;
	excerpt?: string | null;
}

/**
 * ブログ記事のヘッダー部分を表示するコンポーネント
 * タイトル、カテゴリ、投稿日、投稿者などの基本情報を表示
 */
export function BlogHeader({
	title,
	category,
	publishedAt,
	authorId,
	organizationId,
	excerpt,
}: BlogHeaderProps) {
	return (
		<div className="space-y-4">
			{/* カテゴリバッジ */}
			{category && (
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="text-xs">
						{getCategoryDisplayName(category)}
					</Badge>
				</div>
			)}

			{/* タイトル */}
			<h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">{title}</h1>

			{/* 概要 */}
			{excerpt && <p className="text-lg text-muted-foreground leading-relaxed">{excerpt}</p>}

			{/* メタ情報 */}
			<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
				{/* 投稿者 */}
				{authorId && (
					<div className="flex items-center gap-1">
						<User className="h-4 w-4" />
						<span>投稿者: {formatAuthorId(authorId)}</span>
					</div>
				)}

				{/* 投稿日 */}
				{publishedAt && (
					<div className="flex items-center gap-1">
						<Calendar className="h-4 w-4" />
						<time dateTime={publishedAt}>{formatPublishedDate(publishedAt)}</time>
					</div>
				)}

				{/* 組織ID（デバッグ用、後で削除予定） */}
				{organizationId && (
					<div className="text-xs opacity-60">組織: {organizationId.slice(0, 8)}...</div>
				)}
			</div>
		</div>
	);
}

/**
 * カテゴリ名を日本語表示名に変換
 */
function getCategoryDisplayName(category: string): string {
	const categoryMap: Record<string, string> = {
		"getting-started": "はじめに",
		"return-management": "返礼品管理",
		"plan-renewal": "プラン更新",
		"advanced-tips": "上級者向けTips",
		announcement: "お知らせ",
		tutorial: "チュートリアル",
		feature: "機能紹介",
		maintenance: "メンテナンス",
	};

	return categoryMap[category] || category;
}

/**
 * 投稿者IDを表示用にフォーマット
 * TODO: 実際のユーザー名を取得する実装に変更
 */
function formatAuthorId(authorId: string): string {
	// 現在はIDの一部のみ表示（後でユーザー名取得機能を実装）
	return `${authorId.slice(0, 8)}...`;
}

/**
 * 投稿日を日本語形式でフォーマット
 */
function formatPublishedDate(publishedAt: string): string {
	const date = new Date(publishedAt);
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "long",
	});
}
