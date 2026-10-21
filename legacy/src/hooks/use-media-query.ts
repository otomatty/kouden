import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
	// 初期値をfalseに設定 (モバイルファースト)
	const [matches, setMatches] = useState<boolean>(false);

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

		// サーバーサイドでは常にfalseを設定
		setMatches(false);
		return () => {}; // 空のクリーンアップ関数を返す
	}, [query, matches]);

	return matches;
}
