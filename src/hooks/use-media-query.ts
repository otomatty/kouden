import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
	// 初期値をnullに設定
	const [matches, setMatches] = useState<boolean | null>(null);

	useEffect(() => {
		// クライアントサイドでのみメディアクエリを評価
		const mediaQuery = window.matchMedia(query);
		setMatches(mediaQuery.matches);

		const handler = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		mediaQuery.addEventListener("change", handler);

		return () => {
			mediaQuery.removeEventListener("change", handler);
		};
	}, [query]);

	// SSRまたは初期レンダリング時はnullを返す
	if (matches === null) {
		return false; // デフォルト値
	}

	return matches;
}
