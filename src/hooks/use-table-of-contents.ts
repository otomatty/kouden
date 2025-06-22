import { useEffect, useState, useRef, useCallback } from "react";
import { extractHeaders, type TocItem } from "@/utils/markdown-utils";

interface UseTableOfContentsOptions {
	content?: string;
	scrollOffset?: number;
	extractFromDOM?: boolean;
}

/**
 * DOMから見出しを抽出する関数（MDX用）
 */
function extractHeadersFromDOM(): TocItem[] {
	const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
	const headers: TocItem[] = [];

	for (const element of headingElements) {
		const level = Number.parseInt(element.tagName.charAt(1));
		const text = element.textContent || "";
		const id = element.id || "";

		if (id && text && level >= 1 && level <= 3) {
			// h1-h3のみ
			headers.push({
				id,
				text,
				level,
			});
		}
	}

	return headers;
}

/**
 * 目次機能のカスタムフック
 * スクロール同期とアクティブ項目の自動スクロール機能を提供
 */
export function useTableOfContents({
	content = "",
	scrollOffset = 100,
	extractFromDOM = false,
}: UseTableOfContentsOptions) {
	const [tocItems, setTocItems] = useState<TocItem[]>([]);
	const [activeId, setActiveId] = useState<string>("");
	const tocContainerRef = useRef<HTMLDivElement>(null);
	const activeItemRef = useRef<HTMLButtonElement>(null);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isScrollingRef = useRef(false);
	const isClickScrollingRef = useRef(false);

	// ヘッダー抽出
	useEffect(() => {
		if (extractFromDOM || !content) {
			// DOMから抽出（MDX用）
			const timer = setTimeout(() => {
				const headers = extractHeadersFromDOM();
				setTocItems(headers);
			}, 100);

			return () => clearTimeout(timer);
		}
		// Markdownから抽出（ブログ用）
		const headers = extractHeaders(content);
		setTocItems(headers);
	}, [content, extractFromDOM]);

	// スクロールイベントの設定
	useEffect(() => {
		if (tocItems.length === 0) return;

		const handleScroll = () => {
			const headingElements = tocItems
				.map((item) => document.getElementById(item.id))
				.filter(Boolean) as HTMLElement[];

			if (headingElements.length === 0) return;

			const scrollPosition = window.scrollY + scrollOffset;
			let newActiveId = "";
			let activeIndex = -1;

			for (let i = headingElements.length - 1; i >= 0; i--) {
				const element = headingElements[i];
				if (element && element.offsetTop <= scrollPosition) {
					newActiveId = element.id;
					activeIndex = i;
					break;
				}
			}

			if (newActiveId !== activeId) {
				setActiveId(newActiveId);

				// 目次の同期スクロール（クリック中は無効）
				if (
					activeIndex >= 0 &&
					tocContainerRef.current &&
					!isScrollingRef.current &&
					!isClickScrollingRef.current
				) {
					syncTocScroll(activeIndex, tocItems.length);
				}
			}
		};

		// スクロールイベントの最適化（throttle）
		const throttledHandleScroll = () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
			scrollTimeoutRef.current = setTimeout(handleScroll, 5);
		};

		window.addEventListener("scroll", throttledHandleScroll, { passive: true });
		handleScroll(); // 初期状態を設定

		return () => {
			window.removeEventListener("scroll", throttledHandleScroll);
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, [tocItems, scrollOffset, activeId]);

	// 目次の同期スクロール関数
	const syncTocScroll = useCallback((activeIndex: number, totalItems: number) => {
		const container = tocContainerRef.current;
		if (!container) return;

		const containerHeight = container.clientHeight;
		const containerScrollHeight = container.scrollHeight;

		// スクロールが不要な場合は何もしない
		if (containerScrollHeight <= containerHeight) return;

		// アクティブ項目の進行率を計算（0-1の範囲）
		const progress = totalItems > 1 ? activeIndex / (totalItems - 1) : 0;

		// 目次のスクロール位置を進行率に基づいて計算
		const maxScroll = containerScrollHeight - containerHeight;
		const targetScrollTop = progress * maxScroll;

		// スクロール中フラグを設定
		isScrollingRef.current = true;

		// カスタムスムーズスクロール
		const startScrollTop = container.scrollTop;
		const scrollDistance = targetScrollTop - startScrollTop;
		const duration = 200;
		const startTime = performance.now();

		const animateScroll = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// easeOutQuart イージング関数
			const easeProgress = 1 - (1 - progress) ** 4;

			const currentScrollTop = startScrollTop + scrollDistance * easeProgress;
			container.scrollTop = currentScrollTop;

			if (progress < 1) {
				requestAnimationFrame(animateScroll);
			} else {
				// スクロール完了後にフラグをリセット
				setTimeout(() => {
					isScrollingRef.current = false;
				}, 50);
			}
		};

		requestAnimationFrame(animateScroll);
	}, []);

	// 目次項目クリック時のスムーススクロール
	const handleItemClick = useCallback((id: string) => {
		const element = document.getElementById(id);
		if (element) {
			// クリック中フラグを設定（自動スクロールを無効化）
			isClickScrollingRef.current = true;

			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});

			// スムーススクロール完了後にフラグをリセット
			// scrollIntoViewの完了を検知するため、少し長めに設定
			setTimeout(() => {
				isClickScrollingRef.current = false;
			}, 1000);
		}
	}, []);

	return {
		tocItems,
		activeId,
		tocContainerRef,
		activeItemRef,
		handleItemClick,
	};
}
