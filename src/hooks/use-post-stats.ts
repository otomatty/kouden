import { useEffect, useState, useCallback } from "react";
import { getPostStats, getBulkPostStats } from "@/app/_actions/blog/analytics";
import type { PostStats } from "@/types/blog";

interface UsePostStatsOptions {
	postId: string;
	enabled?: boolean;
	refetchInterval?: number;
}

interface UsePostStatsReturn {
	stats: PostStats | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 記事統計情報を管理するカスタムフック
 *
 * @param options - フックのオプション
 * @returns 統計情報、ローディング状態、エラー、再取得関数
 */
export function usePostStats({
	postId,
	enabled = true,
	refetchInterval,
}: UsePostStatsOptions): UsePostStatsReturn {
	const [stats, setStats] = useState<PostStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!postId) return;
		if (!enabled) return;

		try {
			setError(null);
			const data = await getPostStats(postId);
			setStats(data);
		} catch (err) {
			console.error("Failed to fetch post stats:", err);
			setError("統計情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [postId, enabled]);

	const refetch = useCallback(async () => {
		setLoading(true);
		await fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		if (enabled && postId) {
			fetchStats();
		}
	}, [fetchStats, enabled, postId]);

	// 定期的な再取得
	useEffect(() => {
		if (!refetchInterval) return;
		if (!enabled) return;

		const interval = setInterval(fetchStats, refetchInterval);
		return () => clearInterval(interval);
	}, [fetchStats, refetchInterval, enabled]);

	return {
		stats,
		loading,
		error,
		refetch,
	};
}

interface UseBulkPostStatsOptions {
	postIds: string[];
	enabled?: boolean;
}

interface UseBulkPostStatsReturn {
	statsMap: Record<string, { view_count: number; bookmark_count: number }>;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 複数記事の統計情報を一括取得するカスタムフック
 *
 * @param options - フックのオプション
 * @returns 統計情報マップ、ローディング状態、エラー、再取得関数
 */
export function useBulkPostStats({
	postIds,
	enabled = true,
}: UseBulkPostStatsOptions): UseBulkPostStatsReturn {
	const [statsMap, setStatsMap] = useState<
		Record<string, { view_count: number; bookmark_count: number }>
	>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchBulkStats = useCallback(async () => {
		if (!postIds.length) return;
		if (!enabled) return;

		try {
			setError(null);
			const data = await getBulkPostStats(postIds);
			setStatsMap(data);
		} catch (err) {
			console.error("Failed to fetch bulk post stats:", err);
			setError("統計情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [postIds, enabled]);

	const refetch = useCallback(async () => {
		setLoading(true);
		await fetchBulkStats();
	}, [fetchBulkStats]);

	useEffect(() => {
		if (enabled && postIds.length > 0) {
			fetchBulkStats();
		}
	}, [fetchBulkStats, enabled, postIds]);

	return {
		statsMap,
		loading,
		error,
		refetch,
	};
}
