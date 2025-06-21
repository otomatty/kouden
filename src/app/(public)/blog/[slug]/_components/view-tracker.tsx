"use client";

import { useEffect, useRef } from "react";
import { recordPostView } from "@/app/_actions/blog/analytics";

interface ViewTrackerProps {
	postId: string;
}

// グローバルレベルでの重複防止
declare global {
	interface Window {
		__blogViewRecording?: Set<string>;
	}
}

/**
 * 記事閲覧数追跡コンポーネント
 * ページ読み込み時に自動的に閲覧数を記録する（厳格な重複実行防止）
 *
 * @param postId - 記事ID
 */
export function ViewTracker({ postId }: ViewTrackerProps) {
	const hasRecordedRef = useRef(false);
	const currentPostIdRef = useRef<string | null>(null);
	const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));

	useEffect(() => {
		const componentId = componentIdRef.current;

		// グローバル重複防止セットの初期化
		if (typeof window !== "undefined" && !window.__blogViewRecording) {
			window.__blogViewRecording = new Set<string>();
		}

		// セッションストレージキー
		const sessionKey = `blog_view_recorded_${postId}`;

		// グローバルレベルでの重複チェック（最優先）
		if (typeof window !== "undefined" && window.__blogViewRecording?.has(postId)) {
			return;
		}

		// セッションストレージでの重複チェック
		if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey)) {
			return;
		}

		// 既に記録済み、または同じ記事IDの場合は何もしない
		if (hasRecordedRef.current && currentPostIdRef.current === postId) {
			return;
		}

		// 記事IDが変わった場合はリセット
		if (currentPostIdRef.current !== postId) {
			hasRecordedRef.current = false;
			currentPostIdRef.current = postId;
		}

		// 記録済みフラグをチェック
		if (hasRecordedRef.current) {
			return;
		}

		// ページ読み込み時に閲覧数を記録
		const recordView = async () => {
			// 重複実行を防ぐため、実行前に再度チェック
			if (hasRecordedRef.current) {
				return;
			}

			// グローバルレベルで再度チェック
			if (typeof window !== "undefined" && window.__blogViewRecording?.has(postId)) {
				return;
			}

			// セッションストレージで再度チェック
			if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey)) {
				return;
			}

			// **重要：全てのフラグを先に設定してから処理開始**
			hasRecordedRef.current = true;

			// グローバルセットに追加
			if (typeof window !== "undefined" && window.__blogViewRecording) {
				window.__blogViewRecording.add(postId);
			}

			// セッションストレージにフラグを設定
			if (typeof window !== "undefined") {
				sessionStorage.setItem(sessionKey, "true");
			}

			try {
				const result = await recordPostView(postId);

				// サーバーサイドで重複だった場合でも、フロントエンドでは記録済みとして扱う
				if (!result.success) {
					// 実際のエラーの場合のみリセット

					hasRecordedRef.current = false;
					if (typeof window !== "undefined") {
						sessionStorage.removeItem(sessionKey);
						window.__blogViewRecording?.delete(postId);
					}
				}

				// result.recorded が false の場合（重複スキップ）は、フラグはそのまま有効にしておく
			} catch (error) {
				// エラーが発生した場合はフラグをリセット（リトライ可能にする）
				console.error(`❌ [ViewTracker] ${componentId} - Exception occurred for ${postId}:`, error);
				hasRecordedRef.current = false;
				if (typeof window !== "undefined") {
					sessionStorage.removeItem(sessionKey);
					window.__blogViewRecording?.delete(postId);
				}
				console.error("Failed to record view:", error);
			}
		};

		// 少し遅延させて記録（ページ読み込み完了を待つ）
		const timer = setTimeout(recordView, 1000);

		return () => {
			clearTimeout(timer);
		};
	}, [postId]);

	// UIは表示しない（トラッキングのみ）
	return null;
}
