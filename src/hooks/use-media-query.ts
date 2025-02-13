import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
	// 初期値をfalseに設定 (モバイルファースト)
	const [matches, setMatches] = useState<boolean | null>(false);

	useEffect(() => {
		// クライアントサイドでのみメディアクエリを評価 (SSR対策)
		if (typeof window !== "undefined") {
			const mediaQuery = window.matchMedia(query);
			if (mediaQuery.matches !== matches) {
				setMatches(mediaQuery.matches);
			}

			const handler = (event: MediaQueryListEvent) => {
				setMatches(event.matches);
			};

			mediaQuery.addEventListener("change", handler);

			return () => {
				mediaQuery.removeEventListener("change", handler);
			};
		}
	}, [query, matches]);

	// SSRまたは初期レンダリング時はnullを返す
	if (matches === null) {
		return false; // デフォルト値
	}

	return matches;
}
