import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
	// 初期値をクライアントサイドとサーバーサイドで条件分岐
	const [matches, setMatches] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			return window.matchMedia(query).matches;
		}
		return false;
	});

	useEffect(() => {
		// クライアントサイドでのみメディアクエリを評価 (SSR対策)
		if (typeof window !== "undefined") {
			const mediaQuery = window.matchMedia(query);
			const handler = (event: MediaQueryListEvent) => {
				setMatches(event.matches);
			};

			mediaQuery.addEventListener("change", handler);

			return () => {
				mediaQuery.removeEventListener("change", handler);
			};
		}
		return () => {}; // サーバーサイドで実行された場合もクリーンアップ関数を返す
	}, [query]);

	return matches;
}
