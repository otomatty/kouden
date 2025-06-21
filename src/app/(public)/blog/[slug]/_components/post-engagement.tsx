"use client";

import { BookmarkButton } from "@/components/blog/bookmark-button";
import { PostStats } from "@/components/blog/post-stats";

interface PostEngagementProps {
	postId: string;
	className?: string;
}

/**
 * 記事エンゲージメントコンポーネント
 * 統計情報の表示とブックマーク機能を提供
 *
 * @param postId - 記事ID
 * @param className - 追加のCSSクラス
 */
export function PostEngagement({ postId, className = "" }: PostEngagementProps) {
	return (
		<div className={`flex items-center justify-between ${className}`}>
			{/* 統計情報 */}
			<PostStats postId={postId} />

			{/* ブックマークボタン */}
			<BookmarkButton
				postId={postId}
				initialBookmarked={false}
				showText={true}
				variant="outline"
				size="sm"
			/>
		</div>
	);
}
