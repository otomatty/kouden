/**
 * CSRF保護プロバイダー
 * アプリ全体でCSRFトークンを管理するContext
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCSRFToken } from "@/hooks/use-csrf-token";

interface CSRFContextValue {
	token: string | null;
	isLoading: boolean;
	error: string | null;
	fetchWithCSRF: (url: string, options?: RequestInit) => Promise<Response>;
	getCSRFHeaders: () => Record<string, string | undefined>;
	refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextValue | undefined>(undefined);

interface CSRFProviderProps {
	children: ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
	const csrfToken = useCSRFToken();

	return <CSRFContext.Provider value={csrfToken}>{children}</CSRFContext.Provider>;
}

/**
 * CSRFコンテキストを使用するフック
 */
export function useCSRF() {
	const context = useContext(CSRFContext);
	if (context === undefined) {
		throw new Error("useCSRF must be used within a CSRFProvider");
	}
	return context;
}
