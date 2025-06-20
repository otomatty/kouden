/**
 * CSRF保護用のReactフック
 * トークンの取得・更新・送信を自動化
 */

import { useEffect, useState, useCallback } from "react";

interface CSRFTokenResponse {
	csrfToken: string;
	message: string;
}

export function useCSRFToken() {
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * CSRFトークンを取得
	 */
	const fetchToken = useCallback(async () => {
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
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to fetch CSRF token";
			setError(errorMessage);
			console.error("CSRF token fetch error:", err);
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
			// トークンがない場合は取得
			if (!token) {
				await fetchToken();
			}

			const headers = new Headers(options.headers);
			if (token) {
				headers.set("X-CSRF-Token", token);
			}

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
