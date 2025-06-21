"use client";

import { useState, useEffect } from "react";
import { Eye, Bookmark } from "lucide-react";
import { getPostStats } from "@/app/_actions/blog/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface PostStatsProps {
	postId: string;
	showLabels?: boolean;
	className?: string;
}

/**
 * 記事統計表示コンポーネント
 * 閲覧数とブックマーク数をリアルタイムで表示
 *
 * @param postId - 記事ID
 * @param showLabels - ラベル表示の有無
 * @param className - 追加のCSSクラス
 */
export function PostStats({ postId, showLabels = false, className = "" }: PostStatsProps) {
	const [stats, setStats] = useState<{
		view_count: number;
		bookmark_count: number;
		last_viewed_at: string | null;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getPostStats(postId);
				setStats(data);
			} catch (err) {
				console.error("Failed to fetch post stats:", err);
				setError("統計情報の取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		if (postId) {
			fetchStats();
		}
	}, [postId]);

	if (loading) {
		return (
			<div className={`flex items-center gap-4 ${className}`}>
				<div className="flex items-center gap-1">
					<Skeleton className="w-4 h-4" />
					<Skeleton className="w-8 h-4" />
					{showLabels && <Skeleton className="w-8 h-4" />}
				</div>
				<div className="flex items-center gap-1">
					<Skeleton className="w-4 h-4" />
					<Skeleton className="w-8 h-4" />
					{showLabels && <Skeleton className="w-12 h-4" />}
				</div>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className={`text-muted-foreground text-sm ${className}`}>
				統計情報を取得できませんでした
			</div>
		);
	}

	return (
		<div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
			{/* 閲覧数 */}
			<div className="flex items-center gap-1">
				<Eye className="w-4 h-4" />
				<span className="font-medium">{stats.view_count.toLocaleString()}</span>
				{showLabels && <span>閲覧</span>}
			</div>

			{/* ブックマーク数 */}
			<div className="flex items-center gap-1">
				<Bookmark className="w-4 h-4" />
				<span className="font-medium">{stats.bookmark_count.toLocaleString()}</span>
				{showLabels && <span>ブックマーク</span>}
			</div>
		</div>
	);
}
