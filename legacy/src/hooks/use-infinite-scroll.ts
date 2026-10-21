"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
	loadMore: (cursor?: string) => Promise<{
		data: T[];
		hasMore: boolean;
		nextCursor?: string;
	}>;
	initialData?: T[];
	initialHasMore?: boolean;
	initialCursor?: string;
	rootMargin?: string;
	threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
	data: T[];
	hasMore: boolean;
	isLoading: boolean;
	error: string | null;
	loadMore: () => Promise<void>;
	refresh: () => Promise<void>;
	updateItem: (id: string, updates: Partial<T>) => void;
	updateItemOptimistic: <K extends keyof T>(
		id: string,
		field: K,
		newValue: T[K],
		updateFn: () => Promise<void>,
	) => Promise<void>;
	lastElementRef: (node: HTMLElement | null) => void;
}

/**
 * 無限スクロール用カスタムフック（楽観的更新対応）
 *
 * @param options - 無限スクロールの設定
 * @returns 無限スクロールのstate管理用オブジェクト
 */
export function useInfiniteScroll<T extends { id?: string; koudenEntryId?: string }>({
	loadMore,
	initialData = [],
	initialHasMore = true,
	initialCursor,
	rootMargin = "100px",
	threshold = 1.0,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
	const [data, setData] = useState<T[]>(initialData);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cursor, setCursor] = useState<string | undefined>(initialCursor);

	const observer = useRef<IntersectionObserver | null>(null);

	const handleLoadMore = useCallback(async () => {
		if (isLoading || !hasMore) return;

		setIsLoading(true);
		setError(null);

		try {
			const result = await loadMore(cursor);

			setData((prev) => [...prev, ...result.data]);
			setHasMore(result.hasMore);
			setCursor(result.nextCursor);
		} catch (err) {
			setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
		} finally {
			setIsLoading(false);
		}
	}, [cursor, hasMore, isLoading, loadMore]);

	const refresh = useCallback(async () => {
		setData([]);
		setHasMore(true);
		setCursor(undefined);
		setError(null);
		setIsLoading(true);

		try {
			const result = await loadMore();

			setData(result.data);
			setHasMore(result.hasMore);
			setCursor(result.nextCursor);
		} catch (err) {
			setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
		} finally {
			setIsLoading(false);
		}
	}, [loadMore]);

	/**
	 * アイテムを即座に更新する（楽観的更新なし）
	 */
	const updateItem = useCallback((id: string, updates: Partial<T>) => {
		setData((prev) =>
			prev.map((item) => {
				const itemId = (item.koudenEntryId as string) || (item.id as string);
				return itemId === id ? { ...item, ...updates } : item;
			}),
		);
	}, []);

	/**
	 * 楽観的更新を行う
	 * 1. 即座にUIを更新
	 * 2. サーバーに更新リクエスト
	 * 3. エラー時は元の値に戻す
	 */
	const updateItemOptimistic = useCallback(
		async <K extends keyof T>(
			id: string,
			field: K,
			newValue: T[K],
			updateFn: () => Promise<void>,
		) => {
			// 元の値を保存
			let originalValue: T[K] | undefined;
			const originalItem = data.find((item) => {
				const itemId = (item.koudenEntryId as string) || (item.id as string);
				return itemId === id;
			});

			if (originalItem) {
				originalValue = originalItem[field];
			}

			// 1. 即座にUIを更新（楽観的更新）
			setData((prev) =>
				prev.map((item) => {
					const itemId = (item.koudenEntryId as string) || (item.id as string);
					return itemId === id ? { ...item, [field]: newValue } : item;
				}),
			);

			try {
				// 2. サーバーに更新リクエスト
				await updateFn();
				// 成功時は何もしない（既にUIは更新済み）
			} catch (error) {
				// 3. エラー時は元の値に戻す（ロールバック）
				if (originalValue !== undefined) {
					setData((prev) =>
						prev.map((item) => {
							const itemId = (item.koudenEntryId as string) || (item.id as string);
							return itemId === id ? { ...item, [field]: originalValue } : item;
						}),
					);
				}
				// エラーを再スロー
				throw error;
			}
		},
		[data],
	);

	const lastElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (isLoading) return;

			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && hasMore) {
						handleLoadMore();
					}
				},
				{
					rootMargin,
					threshold,
				},
			);

			if (node) observer.current.observe(node);
		},
		[isLoading, hasMore, handleLoadMore, rootMargin, threshold],
	);

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (observer.current) {
				observer.current.disconnect();
			}
		};
	}, []);

	return {
		data,
		hasMore,
		isLoading,
		error,
		loadMore: handleLoadMore,
		refresh,
		updateItem,
		updateItemOptimistic,
		lastElementRef,
	};
}
