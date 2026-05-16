/**
 * CSRF保護用のReactフック
 * トークンの取得・更新・送信を自動化
 */

import { useCallback, useEffect, useState } from "react";

interface CSRFTokenResponse {
	csrfToken: string;
	message: string;
}

export function useCSRFToken() {
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * CSRFトークンを取得して state を更新し、取得したトークン値そのものも返す。
	 *
	 * 返り値を返しているのは、`fetchWithCSRF` 等の同一クロージャ内で
	 * `await fetchToken()` 直後に最新トークンを使いたいケースのため。
	 * React の state 更新はバッチされて非同期に反映されるので、
	 * `await fetchToken()` 直後の `token` クロージャ変数は依然として古い値
	 * （初回 fetchWithCSRF 呼び出し時は `null`）を指している。そのまま読むと
	 * `X-CSRF-Token` 未付与で 403 になるため、戻り値経由で受け渡す。
	 */
	const fetchToken = useCallback(async (): Promise<string | null> => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/csrf-token", {
				method: "GET",
				credentials: "include", // Cookieを含める
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: CSRFTokenResponse = await response.json();
			setToken(data.csrfToken);
			return data.csrfToken;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to fetch CSRF token";
			setError(errorMessage);
			console.error("CSRF token fetch error:", err);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * トークンを初回取得
	 */
	useEffect(() => {
		fetchToken();
	}, [fetchToken]);

	/**
	 * CSRFトークンをヘッダーに含めるfetch関数
	 */
	const fetchWithCSRF = useCallback(
		async (url: string, options: RequestInit = {}) => {
			// 初回呼び出し時は token state がまだ null なので fetchToken の戻り値を
			// 使う（state 経由だと同一同期パス内では古い値しか読めない）。
			let currentToken = token;
			if (!currentToken) {
				currentToken = await fetchToken();
			}
			if (!currentToken) {
				// トークン取得自体が失敗している場合、本リクエストを送ると CSRF ヘッダー
				// 抜きで 403 を食らうだけで、呼び出し側には原因が「トークン取得失敗」だと
				// 伝わらない。明示的に throw して上位で扱えるようにする。
				throw new Error("Failed to obtain CSRF token");
			}

			const headers = new Headers(options.headers);
			headers.set("X-CSRF-Token", currentToken);

			return fetch(url, {
				...options,
				headers,
				credentials: "include",
			});
		},
		[token, fetchToken],
	);

	/**
	 * フォーム送信時に使用するためのヘッダーオブジェクト
	 */
	const getCSRFHeaders = useCallback(() => {
		return token
			? {
					"X-CSRF-Token": token,
				}
			: {};
	}, [token]);

	/**
	 * トークンを手動で更新
	 */
	const refreshToken = useCallback(async () => {
		await fetchToken();
	}, [fetchToken]);

	return {
		token,
		isLoading,
		error,
		fetchWithCSRF,
		getCSRFHeaders,
		refreshToken,
	};
}
